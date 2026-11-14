import { NextResponse } from "next/server";
import {
  getHistoricalMarketData,
  getHistoricalNews,
} from "@/lib/market/historical";
import { buildResearchStates } from "@/lib/market/normalize";
import { analyzeSymbol } from "@/lib/nace/drex";

export const runtime = "nodejs";

export async function POST() {
  try {
    const [bars, news] = await Promise.all([
      getHistoricalMarketData(),
      getHistoricalNews(),
    ]);

    const states = buildResearchStates(
      bars,
      news
    );

    const results = await Promise.allSettled(
      states.map(analyzeSymbol)
    );

    return NextResponse.json({
      mode: "historical",
      results: results.map((result, index) =>
        result.status === "fulfilled"
          ? result.value
          : {
              symbol: states[index].symbol,
              error: "Symbol analysis failed",
            }
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Historical research failed" },
      { status: 500 }
    );
  }
}