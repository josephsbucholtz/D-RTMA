import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { fetchAlpacaMarket, type NormalizedMarketData } from "../../../lib/market/alpaca";

type MarketFile = { date: string; timezone: "America/New_York"; symbols: Record<string, NormalizedMarketData> };

function responseError(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

function isMarketOpen(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = values.weekday;
  const hour = Number(values.hour);
  const minute = Number(values.minute);
  const minutes = hour * 60 + minute;
  return !["Sat", "Sun"].includes(weekday) && minutes >= 570 && minutes < 960;
}

async function readHistorical(date: string) {
  const filePath = path.join(process.cwd(), "data", `market-${date}.json`);
  return JSON.parse(await readFile(filePath, "utf8")) as MarketFile;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawSymbol = url.searchParams.get("symbol") ?? "";
  const mode = url.searchParams.get("mode");
  const symbol = rawSymbol.toUpperCase();

  if (!/^[A-Z]{1,5}$/.test(symbol)) return responseError("Symbol must contain 1–5 letters", "invalid_symbol", 400);
  if (mode !== "live" && mode !== "historical") return responseError("Mode must be live or historical", "invalid_mode", 400);

  try {
    if (mode === "historical") {
      const [thursday, friday] = await Promise.all([readHistorical("2026-11-12"), readHistorical("2026-11-13")]);
      const thursdayData = thursday.symbols[symbol];
      const fridayData = friday.symbols[symbol];
      if (!thursdayData || !fridayData) return responseError("Recorded data is unavailable for this symbol", "historical_data_missing", 404);
      return NextResponse.json({ data: { ...fridayData, symbol, mode: "historical", marketOpen: true, contextBars: thursdayData.bars, bars: fridayData.bars, news: [...thursdayData.news, ...fridayData.news].sort((a, b) => a.timestamp.localeCompare(b.timestamp)) } });
    }

    const now = new Date();
    if (!isMarketOpen(now)) {
      return NextResponse.json({ data: { symbol, mode: "live", marketOpen: false, bars: [], contextBars: [], news: [], fetchedAt: now.toISOString() } satisfies NormalizedMarketData });
    }
    const start = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const data = await fetchAlpacaMarket(symbol, start, now.toISOString(), "live");
    return NextResponse.json({ data: { ...data, marketOpen: true } });
  } catch (error) {
    console.error("market_route_error", { code: "market_request_failed", symbol, mode, timestamp: new Date().toISOString(), message: error instanceof Error ? error.message : "unknown" });
    return responseError("Market data is temporarily unavailable", "market_request_failed", 502);
  }
}
