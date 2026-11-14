import { TimeFrame } from "@alpacahq/alpaca-trade-api";
import { getAlpacaClient } from "@/lib/client";
import { SYMBOLS } from "./config";
import type { LiveMarketSnapshot, MarketBar, MarketQuote, NewsArticle } from "./types";

function toIso(value: unknown) {
  const date = new Date(String(value ?? new Date().toISOString()));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeLatestBar(value: unknown): MarketBar | null {
  const bar = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const close = toNumber(bar.close ?? bar.c);
  if (!close) return null;
  return {
    timestamp: toIso(bar.timestamp ?? bar.t),
    open: toNumber(bar.open ?? bar.o),
    high: toNumber(bar.high ?? bar.h),
    low: toNumber(bar.low ?? bar.l),
    close,
    volume: toNumber(bar.volume ?? bar.v),
  };
}

function normalizeQuote(symbol: string, value: unknown, fallbackLastPrice = 0): MarketQuote {
  const quote = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const bidPrice = toNumber(quote.bidPrice ?? quote.bp);
  const askPrice = toNumber(quote.askPrice ?? quote.ap);
  const lastPrice = toNumber(quote.lastPrice ?? quote.price ?? quote.p) || fallbackLastPrice || (bidPrice + askPrice) / 2;
  const spread = askPrice > 0 && bidPrice > 0 ? askPrice - bidPrice : 0;
  return {
    symbol,
    timestamp: toIso(quote.timestamp ?? quote.t),
    bidPrice,
    bidSize: toNumber(quote.bidSize ?? quote.bs),
    askPrice,
    askSize: toNumber(quote.askSize ?? quote.as),
    spread,
    spreadPercent: lastPrice > 0 ? spread / lastPrice : 0,
    lastPrice,
  };
}

function normalizeNewsArticle(value: unknown): NewsArticle | null {
  const article = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const headline = String(article.headline ?? article.title ?? "").trim();
  if (!headline) return null;
  return {
    id: String(article.id ?? headline),
    headline,
    summary: String(article.summary ?? ""),
    source: String(article.source ?? ""),
    url: typeof article.url === "string" ? article.url : undefined,
    symbols: Array.isArray(article.symbols) ? article.symbols.map(String) : [],
    publishedAt: toIso(article.createdAt ?? article.publishedAt ?? article.timestamp),
  };
}

export async function getLiveMarketSnapshot(
  symbols: readonly string[] = SYMBOLS
): Promise<LiveMarketSnapshot> {
  const alpaca = getAlpacaClient();
  const generatedAt = new Date().toISOString();
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const symbolList = [...symbols];

  const [latestBars, latestQuotes, news] = await Promise.all([
    alpaca.marketData.stocks.stockLatestBars({ symbols: symbolList.join(","), feed: "iex" }),
    alpaca.marketData.stocks.stockLatestQuotes({ symbols: symbolList.join(","), feed: "iex" }),
    alpaca.marketData.collectNews({ symbols: symbolList, start, end: new Date(), limit: 50 }),
  ]);

  const barsBySymbol: Record<string, MarketBar[]> = {};
  const quotesBySymbol: Record<string, MarketQuote> = {};
  const rawBars = latestBars.bars as Record<string, unknown>;
  const rawQuotes = latestQuotes.quotes as Record<string, unknown>;

  for (const symbol of symbolList) {
    const bar = normalizeLatestBar(rawBars[symbol]);
    barsBySymbol[symbol] = bar ? [bar] : [];
    quotesBySymbol[symbol] = normalizeQuote(symbol, rawQuotes[symbol], bar?.close);
  }

  return {
    mode: "live",
    generatedAt,
    barsBySymbol,
    quotesBySymbol,
    news: news.map(normalizeNewsArticle).filter((article): article is NewsArticle => article !== null),
  };
}

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
