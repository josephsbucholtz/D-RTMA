import { getMockScenario } from "./mock-scenarios";

export const USE_MOCK = false;

export type DataMode = "live" | "historical";
export type ResearchAction = "buy" | "hold" | "sell";
export type Finding = { claim: string; stance: "bullish" | "bearish" | "neutral"; source: string; latency: string };
export type ResearchData = { symbol: string; action: ResearchAction; confidence: number; risk: "low" | "moderate" | "high"; evidenceSufficient: boolean; timestamp: string; primaryRisk: string; findings: Finding[]; priceSeries: number[] };
export type DocumentData = { filename: string; text: string };
export type ApiResult<T> = { data: T; usedMock: boolean; error?: string; code?: string };
export type MarketBar = { timestamp: string; open: number; high: number; low: number; close: number; volume: number; mode: DataMode };
export type MarketNews = { id: string; timestamp: string; headline: string; summary: string; source: string; url: string; symbols: string[]; mode: DataMode };
export type MarketData = { symbol: string; mode: DataMode; marketOpen: boolean; bars: MarketBar[]; contextBars: MarketBar[]; news: MarketNews[]; fetchedAt: string };

export async function runResearch(symbol: string, _question: string, _mode: DataMode): Promise<ApiResult<ResearchData>> {
  void _question;
  void _mode;
  if (USE_MOCK) return { data: getMockScenario(symbol), usedMock: true };
  return { data: getMockScenario(symbol), usedMock: true };
}

function fallbackMarket(symbol: string): MarketData {
  const scenario = getMockScenario(symbol);
  const makeBar = (close: number, index: number, date: string): MarketBar => ({ timestamp: `${date}T${String(14 + Math.floor(index / 60)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}:00.000Z`, open: close - 0.2, high: close + 0.5, low: close - 0.6, close, volume: 1000000 + index * 2500, mode: "historical" });
  const contextBars = scenario.priceSeries.slice(0, 10).map((price, index) => makeBar(price, index, "2026-11-12"));
  const bars = scenario.priceSeries.slice(10).map((price, index) => makeBar(price, index, "2026-11-13"));
  const news = scenario.findings.slice(0, 3).map((finding, index) => ({ id: `mock-${symbol}-${index}`, timestamp: bars[Math.min(index * 4, bars.length - 1)]?.timestamp ?? "2026-11-13T15:00:00.000Z", headline: finding.claim, summary: finding.claim, source: finding.source, url: "", symbols: [symbol], mode: "historical" as const }));
  return { symbol, mode: "historical", marketOpen: true, bars, contextBars, news, fetchedAt: new Date().toISOString() };
}

export async function fetchMarketData(symbol: string, mode: DataMode): Promise<ApiResult<MarketData>> {
  if (USE_MOCK) return { data: fallbackMarket(symbol), usedMock: true };
  try {
    const response = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&mode=${mode}`);
    const payload = (await response.json()) as { data?: MarketData; error?: string; code?: string };
    if (!response.ok || !payload.data) throw new Error(payload.error ?? payload.code ?? "Market route unavailable");
    return { data: payload.data, usedMock: false };
  } catch (error) {
    return { data: fallbackMarket(symbol), usedMock: true, error: error instanceof Error ? error.message : "Market route unavailable", code: "recorded_data_fallback" };
  }
}

export async function uploadDocument(file: File): Promise<ApiResult<DocumentData>> {
  return { data: { filename: file.name, text: "Management reiterated durable demand across the current product cycle. The report highlights improving customer adoption, while noting concentration and valuation sensitivity as risks to monitor." }, usedMock: true };
}
