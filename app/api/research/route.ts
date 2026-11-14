import { NextResponse } from "next/server";

import { SYMBOLS } from "@/lib/market/config";
import { getHistoricalResearchData } from "@/lib/market/historical";
import { normalizeSymbolState } from "@/lib/market/normalize";
import { getLiveSymbolState } from "@/lib/market/live";
import { analyzeWithDrex } from "@/lib/nace/drex";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const mode = body.mode ?? "historical";
    const date = body.date ?? "2026-11-13";

    if (mode !== "historical" && mode !== "live") {
      return NextResponse.json(
        {
          error: `Invalid mode: ${mode}. Use "historical" or "live".`,
        },
        { status: 400 }
      );
    }

    let states;

    if (mode === "historical") {
      const historicalData = await getHistoricalResearchData(
        date,
        SYMBOLS
      );

      states = SYMBOLS.map((symbol) =>
        normalizeSymbolState(symbol, {
          ...historicalData,
          mode: "historical",
          date,
        })
      );
    } else {
      states = SYMBOLS.map((symbol) =>
        getLiveSymbolState(symbol)
      );
    }

    // All symbols are sent to Drex concurrently.
    const results = await Promise.allSettled(
      states.map((state) =>
        analyzeWithDrex({
          symbol: state.symbol,
          mode: state.mode,
          timestamp: state.timestamp,
          bars: state.bars,
          news: state.news,
        })
      )
    );

    return NextResponse.json({
      mode,
      ...(mode === "historical" ? { date } : {}),
      results: results.map((result, index) => {
        const symbol = states[index].symbol;

        if (result.status === "fulfilled") {
          return {
            symbol,
            success: true,
            analysis: result.value,
          };
        }

        const error =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);

        console.error(`[Research] ${symbol} failed:`, result.reason);

        return {
          symbol,
          success: false,
          error,
        };
      }),
    });
  } catch (error) {
    console.error("[Research API] Failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Research request failed",
      },
      { status: 500 }
    );
  }
}