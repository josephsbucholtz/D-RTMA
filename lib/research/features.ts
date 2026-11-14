import type { ResearchState } from "@/lib/market/types";

function percentChange(current: number, previous: number) {
  return previous === 0 ? 0 : (current - previous) / previous;
}

export function calculateFeatures(state: ResearchState) {
  const bars = state.bars;
  const latest = bars.at(-1);
  const fiveMinute = bars.at(-6) ?? bars.at(0);
  const thirtyMinute = bars.at(-31) ?? bars.at(0);
  const recentVolumes = bars.slice(-30).map((bar) => bar.volume).filter(Boolean);
  const averageVolume = recentVolumes.length
    ? recentVolumes.reduce((sum, volume) => sum + volume, 0) / recentVolumes.length
    : 0;
  const returns = bars.slice(-30).flatMap((bar, index, values) => {
    const previous = values[index - 1];
    return previous ? [percentChange(bar.close, previous.close)] : [];
  });
  const mean = returns.length
    ? returns.reduce((sum, value) => sum + value, 0) / returns.length
    : 0;
  const variance = returns.length
    ? returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length
    : 0;

  return {
    return5m: latest && fiveMinute ? percentChange(latest.close, fiveMinute.close) : 0,
    return30m: latest && thirtyMinute ? percentChange(latest.close, thirtyMinute.close) : 0,
    volumeVsAverage:
      latest && averageVolume > 0 ? latest.volume / averageVolume : 0,
    volatility: Math.sqrt(variance),
    latestClose: latest?.close ?? 0,
    barCount: bars.length,
  };
}
