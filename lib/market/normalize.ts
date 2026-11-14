// src/lib/market/normalize.ts

import type { ResearchState } from "./types";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function valueFrom(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function asNumber(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asIsoTimestamp(value: unknown, fallback: string) {
  const date = new Date(String(value ?? fallback));
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

export function normalizeBars(value: unknown): ResearchState["bars"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const bar = asRecord(entry);
    const timestamp = asIsoTimestamp(
      valueFrom(bar, "timestamp", "Timestamp", "t"),
      new Date().toISOString()
    );
    const open = asNumber(valueFrom(bar, "open", "Open", "o"));
    const high = asNumber(valueFrom(bar, "high", "High", "h"));
    const low = asNumber(valueFrom(bar, "low", "Low", "l"));
    const close = asNumber(valueFrom(bar, "close", "Close", "c"));
    const volume = asNumber(valueFrom(bar, "volume", "Volume", "v"));

    return close > 0 && high > 0 && low > 0
      ? [{ timestamp, open, high, low, close, volume }]
      : [];
  });
}

export function normalizeNews(value: unknown): ResearchState["news"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const article = asRecord(entry);
    const symbols = valueFrom(article, "symbols", "Symbols");
    const timestamp = valueFrom(
      article,
      "publishedAt",
      "createdAt",
      "updatedAt",
      "timestamp"
    );
    const headline = String(
      valueFrom(article, "headline", "title") ?? ""
    ).trim();

    if (!headline || !timestamp) return [];

    return [
      {
        id: String(valueFrom(article, "id", "articleId") ?? headline),
        headline,
        summary: String(valueFrom(article, "summary", "content") ?? ""),
        source: String(valueFrom(article, "source", "author") ?? ""),
        url: typeof article.url === "string" ? article.url : undefined,
        symbols: Array.isArray(symbols) ? symbols.map(String) : [],
        publishedAt: asIsoTimestamp(timestamp, new Date().toISOString()),
      },
    ];
  });
}

export function normalizeSymbolState(
  symbol: string,
  data: {
    barsBySymbol: Record<string, unknown[]>;
    news: unknown[];
    mode: "historical" | "live";
    date?: string;
  }
): ResearchState {
  const bars = normalizeBars(data.barsBySymbol[symbol]);
  const normalizedNews = normalizeNews(data.news);

  return {
    mode: data.mode,
    symbol,
    timestamp: bars.at(-1)?.timestamp ?? new Date().toISOString(),
    bars,
    news: normalizedNews.filter((article) => article.symbols.includes(symbol)),
  };
}
