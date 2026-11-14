export const USE_MOCK = true;

import { getMockScenario } from "./mock-scenarios";

export type DataMode = "live" | "historical";
export type ResearchAction = "buy" | "hold" | "sell";
export type Finding = { claim: string; stance: "bullish" | "bearish" | "neutral"; source: string; latency: string };
export type ResearchData = { symbol: string; action: ResearchAction; confidence: number; risk: "low" | "moderate" | "high"; evidenceSufficient: boolean; timestamp: string; primaryRisk: string; findings: Finding[]; priceSeries: number[] };
export type DocumentData = { filename: string; text: string };
export type ApiResult<T> = { data: T; usedMock: boolean; error?: string; code?: string };

export async function runResearch(symbol: string, _question: string, _mode: DataMode): Promise<ApiResult<ResearchData>> {
  void _question;
  void _mode;
  if (USE_MOCK) return { data: getMockScenario(symbol), usedMock: true };
  return { data: getMockScenario(symbol), usedMock: true, error: "Mock mode is enabled", code: "mock_enabled" };
}

export async function uploadDocument(file: File): Promise<ApiResult<DocumentData>> {
  return { data: { filename: file.name, text: "Management reiterated durable demand across the current product cycle. The report highlights improving customer adoption, while noting concentration and valuation sensitivity as risks to monitor." }, usedMock: true };
}
