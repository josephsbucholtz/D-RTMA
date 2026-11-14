import type { ResearchData } from "./api";

export const TICKERS = ["NVDA", "AAPL", "TSLA", "SNDK"] as const;
export type Ticker = (typeof TICKERS)[number];

export const MOCK_SCENARIOS: Record<Ticker, ResearchData> = {
  NVDA: {
    symbol: "NVDA", action: "buy", confidence: 78, risk: "moderate", evidenceSufficient: true, timestamp: "14 Nov 2024 · 14:35 UTC", primaryRisk: "Valuation compression", priceSeries: [137.3, 139.1, 138.4, 141.8, 144.2, 142.7, 146.8, 149.4, 147.9, 151.6, 153.3, 151.8, 155.4, 158.2, 157.1, 160.8, 163.6, 166.1, 164.7, 168.9, 171.4, 170.2, 173.8, 176.5, 179.2, 181.1, 184.6, 183.7, 187.5, 190.2],
    findings: [
      { claim: "Cloud bookings grew 28% YoY, ahead of guidance", stance: "bullish", source: "Q3 earnings call", latency: "184 ms" },
      { claim: "Price is holding above the 50-day moving average", stance: "bullish", source: "Historical replay", latency: "96 ms" },
      { claim: "Customer concentration remains a monitorable risk", stance: "neutral", source: "10-Q · Risk factors", latency: "241 ms" },
      { claim: "Margin expansion is not yet visible in cash flow", stance: "bearish", source: "Cash flow statement", latency: "207 ms" },
      { claim: "Lead synthesis clears the evidence threshold", stance: "bullish", source: "Lead agent synthesis", latency: "38 ms" },
    ],
  },
  AAPL: {
    symbol: "AAPL", action: "hold", confidence: 64, risk: "low", evidenceSufficient: true, timestamp: "14 Nov 2024 · 14:35 UTC", primaryRisk: "Services growth deceleration", priceSeries: [221.4, 222.1, 221.2, 223.6, 224.4, 223.1, 224.8, 225.6, 224.9, 226.3, 225.7, 227.4, 226.8, 228.1, 227.7, 229.4, 230.2, 229.8, 231.1, 230.5, 232.2, 231.7, 233.4, 232.8, 234.1, 233.6, 234.8, 235.2, 234.7, 236.1],
    findings: [
      { claim: "Services revenue remains a durable growth contributor", stance: "bullish", source: "10-K · Segment data", latency: "155 ms" },
      { claim: "Hardware replacement cycle is moving sideways", stance: "neutral", source: "Earnings call", latency: "182 ms" },
      { claim: "Buyback supports per-share stability", stance: "bullish", source: "Capital allocation", latency: "118 ms" },
      { claim: "China demand remains uneven across channels", stance: "bearish", source: "Regional commentary", latency: "213 ms" },
      { claim: "Evidence supports patience while catalysts develop", stance: "neutral", source: "Lead agent synthesis", latency: "42 ms" },
    ],
  },
  TSLA: {
    symbol: "TSLA", action: "sell", confidence: 71, risk: "high", evidenceSufficient: true, timestamp: "14 Nov 2024 · 14:35 UTC", primaryRisk: "Demand and margin pressure", priceSeries: [248.2, 246.8, 244.5, 247.1, 242.3, 239.8, 241.4, 237.2, 234.8, 236.1, 231.5, 229.8, 232.4, 226.7, 224.3, 228.1, 221.8, 218.7, 220.4, 216.9, 214.2, 217.6, 211.4, 208.2, 210.7, 204.8, 202.1, 205.4, 199.8, 197.6],
    findings: [
      { claim: "Vehicle deliveries are tracking below the prior run rate", stance: "bearish", source: "Delivery report", latency: "172 ms" },
      { claim: "Price trend remains below key moving averages", stance: "bearish", source: "Historical replay", latency: "101 ms" },
      { claim: "Energy storage is a credible offset", stance: "bullish", source: "Investor presentation", latency: "194 ms" },
      { claim: "Automotive gross margin has limited room for error", stance: "bearish", source: "10-Q · Margins", latency: "226 ms" },
      { claim: "Risk-adjusted evidence favors reducing exposure", stance: "bearish", source: "Lead agent synthesis", latency: "47 ms" },
    ],
  },
  SNDK: {
    symbol: "SNDK", action: "buy", confidence: 69, risk: "high", evidenceSufficient: true, timestamp: "14 Nov 2024 · 14:35 UTC", primaryRisk: "Memory cycle reversal", priceSeries: [62.1, 63.8, 62.9, 65.4, 66.1, 64.7, 67.8, 69.2, 68.4, 71.1, 70.3, 72.6, 74.2, 73.1, 75.8, 77.4, 76.2, 79.6, 81.3, 80.1, 83.8, 85.4, 84.9, 87.2, 89.5, 88.1, 91.4, 93.2, 92.6, 95.1],
    findings: [
      { claim: "NAND pricing is recovering into the next cycle", stance: "bullish", source: "Industry channel checks", latency: "163 ms" },
      { claim: "Inventory discipline is improving sequentially", stance: "bullish", source: "Quarterly filing", latency: "205 ms" },
      { claim: "Customer concentration raises downside sensitivity", stance: "neutral", source: "Risk factors", latency: "238 ms" },
      { claim: "Memory demand remains cyclical and volatile", stance: "bearish", source: "Management commentary", latency: "176 ms" },
      { claim: "Lead synthesis finds asymmetric upside with high risk", stance: "bullish", source: "Lead agent synthesis", latency: "44 ms" },
    ],
  },
};

export function detectTicker(question: string): Ticker | null {
  const match = question.toUpperCase().match(/\b(NVDA|AAPL|TSLA|SNDK)\b/);
  return match ? (match[1] as Ticker) : null;
}

export function getMockScenario(symbol: string): ResearchData {
  return MOCK_SCENARIOS[(symbol.toUpperCase() as Ticker)] ?? MOCK_SCENARIOS.NVDA;
}
