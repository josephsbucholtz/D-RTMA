import type { ResearchState } from "@/lib/market/types";

export function calculateFeatures(state: ResearchState) {
  const bars = state.bars;

  if (bars.length < 2) {
    return {
      return5m: 0,
      return30m: 0,
      volumeVsAverage: 0,
      volatility: 0,
    };
  }

  const latest = bars.at(-1)!;
  const previous = bars.at(-2)!;

  return {
    return5m: (latest.close - previous.close) / previous.close,
    return30m: 0,
    volumeVsAverage: 0,
    volatility: 0,
  };
}