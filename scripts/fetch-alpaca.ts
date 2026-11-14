import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
// @ts-expect-error Node's strip-types runner resolves the .ts module directly.
import { fetchAlpacaMarket, type NormalizedMarketData } from "../lib/market/alpaca.ts";

const symbols = ["NVDA", "AAPL", "TSLA", "SNDK"];
const sessions = [
  { date: "2026-11-12", start: "2026-11-12T14:00:00.000Z", end: "2026-11-12T22:00:00.000Z" },
  { date: "2026-11-13", start: "2026-11-13T14:00:00.000Z", end: "2026-11-13T22:00:00.000Z" },
];

type MarketFile = { date: string; timezone: "America/New_York"; symbols: Record<string, NormalizedMarketData> };

async function main() {
  const dataDirectory = path.join(process.cwd(), "data");
  await mkdir(dataDirectory, { recursive: true });
  for (const session of sessions) {
    const entries = await Promise.all(symbols.map(async (symbol) => [symbol, await fetchAlpacaMarket(symbol, session.start, session.end, "historical")] as const));
    const file: MarketFile = { date: session.date, timezone: "America/New_York", symbols: Object.fromEntries(entries) };
    await writeFile(path.join(dataDirectory, `market-${session.date}.json`), `${JSON.stringify(file, null, 2)}\n`, "utf8");
    console.log(`Saved ${session.date} market data for ${symbols.length} symbols`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to fetch Alpaca data");
  process.exitCode = 1;
});
