import { TimeFrame } from "@alpacahq/alpaca-trade-api";
import { getAlpacaClient } from "@/lib/client";
import { SYMBOLS } from "./config";

export async function getLiveResearchData(
  symbols: readonly string[] = SYMBOLS
) {
  const alpaca = getAlpacaClient();
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

  const [barsBySymbol, news] = await Promise.all([
    alpaca.marketData.getStockBars({
      symbols: [...symbols],
      timeframe: TimeFrame.Minute,
      start,
      end,
      feed: "iex",
    }),
    alpaca.marketData.collectNews({
      symbols: [...symbols],
      start,
      end,
      limit: 50,
    }),
  ]);

  return { barsBySymbol, news, generatedAt: end.toISOString() };
}
