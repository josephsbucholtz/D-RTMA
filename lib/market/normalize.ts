// src/lib/market/normalize.ts

import type { ResearchState } from "./types";

export function normalizeSymbolState(
  symbol: string,
  data: {
    barsBySymbol: Record<string, any[]>;
    news: any[];
    mode: "historical" | "live";
    date?: string;
  }
): ResearchState {
  const bars = data.barsBySymbol[symbol] ?? [];

  return {
    mode: data.mode,
    symbol,
    timestamp: new Date().toISOString(),
    bars: bars.map((bar) => ({
      timestamp: new Date(bar.timestamp).toISOString(),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    })),
    news: data.news
      .filter((article) =>
        article.symbols?.includes(symbol)
      )
      .map((article) => ({
        id: String(article.id),
        headline: article.headline,
        summary: article.summary ?? "",
        source: article.source ?? "",
        url: article.url,
        symbols: article.symbols ?? [],
        publishedAt: new Date(
          article.createdAt
        ).toISOString(),
      })),
  };
}