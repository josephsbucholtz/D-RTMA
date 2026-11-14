// src/lib/market/historical.ts

import {
  TimeFrame,
} from "@alpacahq/alpaca-trade-api";
import {getAlpacaClient } from "@/lib/client"
import { SYMBOLS } from "./config";



export async function getHistoricalResearchData(
  date = "2026-11-13",
  symbols: readonly string[] = SYMBOLS
) {
  const alpaca = getAlpacaClient();

  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(`${date}T23:59:59Z`);

  const [barsBySymbol, news] = await Promise.all([
    alpaca.marketData.getStockBars({
      symbols: [...symbols],
      timeframe: TimeFrame.Minute,
      start,
      end,
    }),

    alpaca.marketData.collectNews({
      symbols: [...symbols],
      start,
      end,
    }),
  ]);

  return {
    date,
    barsBySymbol,
    news,
  };
}