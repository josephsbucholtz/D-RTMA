import { NextResponse } from "next/server";
import { isSupportedSymbol, SYMBOLS } from "@/lib/market/config";
import { getLiveMarketSnapshot } from "@/lib/market/live";

export async function GET(request: Request) {
  const symbolsParam = new URL(request.url).searchParams.get("symbols");
  const symbols = symbolsParam ? symbolsParam.split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean) : [...SYMBOLS];

  if (!symbols.length || symbols.some((symbol) => !isSupportedSymbol(symbol))) {
    return NextResponse.json({ error: "Invalid or unsupported symbols", code: "invalid_symbols" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getLiveMarketSnapshot(symbols));
  } catch (error) {
    console.error("[Live Market API] Failed", {
      error: error instanceof Error ? error.message : "Unknown live market error",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Live market data unavailable", code: "live_market_unavailable" }, { status: 503 });
  }
}
