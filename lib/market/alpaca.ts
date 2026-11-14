// Server-only module. Never import this file from a client component.

export type MarketMode = "live" | "historical";

export type NormalizedMarketBar = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  mode: MarketMode;
};

export type NormalizedNewsArticle = {
  id: string;
  timestamp: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  symbols: string[];
  mode: MarketMode;
};

export type NormalizedMarketData = {
  symbol: string;
  mode: MarketMode;
  marketOpen: boolean;
  bars: NormalizedMarketBar[];
  contextBars: NormalizedMarketBar[];
  news: NormalizedNewsArticle[];
  fetchedAt: string;
};

type AlpacaBar = { t?: string; o?: number; h?: number; l?: number; c?: number; v?: number };
type AlpacaNews = { id?: number | string; created_at?: string; updated_at?: string; headline?: string; summary?: string; source?: string; url?: string; symbols?: string[] };

const DATA_BASE_URL = "https://data.alpaca.markets";

function credentials() {
  const keyId = process.env.ALPACA_KEY_ID;
  const secretKey = process.env.ALPACA_SECRET_KEY;
  if (!keyId || !secretKey) throw new Error("Alpaca credentials are not configured");
  return { keyId, secretKey };
}

async function alpacaGet<T>(path: string): Promise<T> {
  const { keyId, secretKey } = credentials();
  const response = await fetch(`${DATA_BASE_URL}${path}`, {
    headers: { Accept: "application/json", "APCA-API-KEY-ID": keyId, "APCA-API-SECRET-KEY": secretKey },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Alpaca request failed with status ${response.status}`);
  return (await response.json()) as T;
}

function normalizeBars(rawBars: AlpacaBar[], mode: MarketMode): NormalizedMarketBar[] {
  return rawBars.flatMap((bar) => {
    if (!bar.t || ![bar.o, bar.h, bar.l, bar.c, bar.v].every((value) => typeof value === "number" && Number.isFinite(value))) return [];
    return [{ timestamp: bar.t, open: bar.o as number, high: bar.h as number, low: bar.l as number, close: bar.c as number, volume: bar.v as number, mode }];
  });
}

function normalizeNews(rawNews: AlpacaNews[], mode: MarketMode): NormalizedNewsArticle[] {
  return rawNews.flatMap((article) => {
    if (article.id === undefined || !article.headline || !article.created_at) return [];
    return [{ id: String(article.id), timestamp: article.created_at, headline: article.headline, summary: article.summary ?? "", source: article.source ?? "Alpaca News", url: article.url ?? "", symbols: article.symbols ?? [], mode }];
  });
}

async function fetchBars(symbol: string, start: string, end: string, mode: MarketMode) {
  const bars: AlpacaBar[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ timeframe: "1Min", start, end, limit: "10000", feed: "iex", sort: "asc" });
    if (pageToken) params.set("page_token", pageToken);
    const payload = await alpacaGet<{ bars?: Record<string, AlpacaBar[]>; next_page_token?: string }>(`/v2/stocks/bars?symbols=${encodeURIComponent(symbol)}&${params.toString()}`);
    bars.push(...(payload.bars?.[symbol] ?? []));
    pageToken = payload.next_page_token ?? "";
  } while (pageToken);
  return normalizeBars(bars, mode);
}

async function fetchNews(symbol: string, start: string, end: string, mode: MarketMode) {
  const news: AlpacaNews[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ symbols: symbol, start, end, limit: "50", sort: "asc", include_content: "false" });
    if (pageToken) params.set("page_token", pageToken);
    const payload = await alpacaGet<{ news?: AlpacaNews[]; next_page_token?: string }>(`/v1beta1/news?${params.toString()}`);
    news.push(...(payload.news ?? []));
    pageToken = payload.next_page_token ?? "";
  } while (pageToken);
  return normalizeNews(news, mode);
}

export async function fetchAlpacaMarket(symbol: string, start: string, end: string, mode: MarketMode): Promise<NormalizedMarketData> {
  const [bars, news] = await Promise.all([fetchBars(symbol, start, end, mode), fetchNews(symbol, start, end, mode)]);
  return { symbol, mode, marketOpen: mode === "live", bars, contextBars: [], news, fetchedAt: new Date().toISOString() };
}
