import { NextResponse } from "next/server";
import pLimit from "p-limit";

import { analyzeWithDrexAgents } from "@/lib/nace/agents";
import { getHistoricalResearchData } from "@/lib/market/historical";
import { getLiveResearchData } from "@/lib/market/live";
import { normalizeSymbolState } from "@/lib/market/normalize";
import { isSupportedSymbol, SYMBOLS } from "@/lib/market/config";
import type { DataMode, ResearchState } from "@/lib/market/types";
import { buildResearchInsights } from "@/lib/research/insights";

const limit = pLimit(2);
const DEFAULT_HISTORICAL_DATE = "2026-11-13";

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Symbol analysis failed";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode: DataMode = body.mode ?? "historical";
    const date = body.date ?? DEFAULT_HISTORICAL_DATE;

    if (mode !== "historical" && mode !== "live") {
      return NextResponse.json(
        { error: "mode must be historical or live", code: "invalid_mode" },
        { status: 400 }
      );
    }

    if (mode === "historical" && !isValidDate(date)) {
      return NextResponse.json(
        { error: "date must be a valid YYYY-MM-DD date", code: "invalid_date" },
        { status: 400 }
      );
    }

    const requestedSymbols = body.symbols ?? SYMBOLS;
    if (
      !Array.isArray(requestedSymbols) ||
      requestedSymbols.length < 1 ||
      requestedSymbols.length > SYMBOLS.length ||
      requestedSymbols.some(
        (symbol) => typeof symbol !== "string" || !isSupportedSymbol(symbol)
      )
    ) {
      return NextResponse.json(
        {
          error: `symbols must contain supported values: ${SYMBOLS.join(", ")}`,
          code: "invalid_symbols",
        },
        { status: 400 }
      );
    }

    const symbols = requestedSymbols.map((symbol: string) => symbol.toUpperCase());
    let states: ResearchState[];
    let generatedAt = new Date().toISOString();

    if (mode === "historical") {
      const historicalData = await getHistoricalResearchData(date, symbols);
      generatedAt = historicalData.generatedAt;
      states = symbols.map((symbol) =>
        normalizeSymbolState(symbol, {
          ...historicalData,
          mode: "historical",
          date,
        })
      );
    } else {
      const liveData = await getLiveResearchData(symbols);
      generatedAt = liveData.generatedAt;
      states = symbols.map((symbol) =>
        normalizeSymbolState(symbol, {
          ...liveData,
          mode: "live",
        })
      );
    }

    const results = await Promise.allSettled(
      states.map((state) =>
        limit(() =>
          analyzeWithDrexAgents({
            symbol: state.symbol,
            mode: state.mode,
            timestamp: state.timestamp,
            bars: state.bars,
            news: state.news,
          })
        )
      )
    );

    return NextResponse.json({
      mode,
      ...(mode === "historical" ? { date } : {}),
      generatedAt,
      results: results.map((result, index) => {
        const state = states[index];

        if (result.status === "fulfilled") {
          return {
            symbol: state.symbol,
            success: true,
            state,
            analysis: result.value,
            insights: buildResearchInsights(state, result.value),
          };
        }

        console.error("[Research] Symbol analysis failed", {
          symbol: state.symbol,
          mode,
          error: errorText(result.reason),
          timestamp: new Date().toISOString(),
        });

        return {
          symbol: state.symbol,
          success: false,
          state,
          error: errorText(result.reason),
        };
      }),
    });
  } catch (error) {
    console.error("[Research API] Failed", {
      error: errorText(error),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Research request failed", code: "research_request_failed" },
      { status: 500 }
    );
  }
}
