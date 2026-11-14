export const USE_MOCK = true;

export type DataMode = "live" | "historical";
export type ResearchAction = "buy" | "hold" | "sell";

export type Finding = {
  claim: string;
  stance: "bullish" | "bearish" | "neutral";
  source: string;
  latency: string;
};

export type ResearchData = {
  symbol: string;
  action: ResearchAction;
  confidence: number;
  risk: "low" | "moderate" | "high";
  evidenceSufficient: boolean;
  timestamp: string;
  primaryRisk: string;
  findings: Finding[];
};

export type DocumentData = {
  filename: string;
  text: string;
};

export type ApiResult<T> = {
  data: T;
  usedMock: boolean;
  error?: string;
  code?: string;
};

const mockResearch: ResearchData = {
  symbol: "NVDA",
  action: "buy",
  confidence: 78,
  risk: "moderate",
  evidenceSufficient: true,
  timestamp: "14 Nov 2024 · 14:35 UTC",
  primaryRisk: "Valuation compression",
  findings: [
    { claim: "Cloud bookings grew 28% YoY, ahead of guidance", stance: "bullish", source: "Q3 earnings call", latency: "184 ms" },
    { claim: "Enterprise pipeline remains concentrated in top 10 accounts", stance: "neutral", source: "10-Q · Risk factors", latency: "241 ms" },
    { claim: "Price holding above 50-day moving average", stance: "bullish", source: "Historical replay", latency: "96 ms" },
    { claim: "Margin expansion is not yet visible in operating cash flow", stance: "bearish", source: "Cash flow statement", latency: "207 ms" },
  ],
};

async function post<T>(url: string, body: BodyInit): Promise<{ data?: T; error?: string; code?: string }> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  const payload = (await response.json()) as { data?: T; error?: string; code?: string };
  if (!response.ok || payload.error || !payload.data) throw new Error(payload.error ?? payload.code ?? `Request failed: ${response.status}`);
  return payload;
}

export async function runResearch(symbol: string, question: string, mode: DataMode): Promise<ApiResult<ResearchData>> {
  if (USE_MOCK) return { data: { ...mockResearch, symbol }, usedMock: true };

  try {
    const payload = await post<ResearchData>("/api/research", JSON.stringify({ symbol, question, mode }));
    return { data: payload.data as ResearchData, usedMock: false };
  } catch (error) {
    return { data: { ...mockResearch, symbol }, usedMock: true, error: error instanceof Error ? error.message : "Research route unavailable", code: "research_fallback" };
  }
}

export async function uploadDocument(file: File): Promise<ApiResult<DocumentData>> {
  if (USE_MOCK) {
    return {
      data: { filename: file.name, text: "Management reiterated durable demand across accelerated computing, with cloud bookings growing ahead of guidance. The filing also notes customer concentration and ongoing valuation sensitivity as key considerations for future results." },
      usedMock: true,
    };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/documents", { method: "POST", body: formData });
    const payload = (await response.json()) as { data?: DocumentData; error?: string; code?: string };
    if (!response.ok || payload.error || !payload.data) throw new Error(payload.error ?? payload.code ?? `Request failed: ${response.status}`);
    return { data: payload.data, usedMock: false };
  } catch (error) {
    return { data: { filename: file.name, text: "The document route is not available yet. Mock extraction found evidence about demand, customer concentration, and valuation sensitivity." }, usedMock: true, error: error instanceof Error ? error.message : "Document route unavailable", code: "document_fallback" };
  }
}
