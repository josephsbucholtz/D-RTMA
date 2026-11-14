import { PriceChart } from "@/components/charts/PriceChart";
import { NewsPanel } from "./NewsPanel";
import { SignalBadge } from "./SignalBadge";

type Result = {
  symbol: string;
  success: boolean;
  state: { bars: Array<{ timestamp: string; close: number }>; news: Array<{ id: string; headline: string; summary: string; source: string; url?: string; publishedAt: string }> };
  insights?: { action: string; actionConfidence: number; eventType: string; riskLevel: number; marketImpact: number; evidenceSufficient: number; primaryRisk: string; model: string; agents: Record<string, unknown>; conclusions: string[]; features: { return5m: number; return30m: number; volumeVsAverage: number; volatility: number; barCount: number } };
  error?: string;
};

function percent(value: number) { return `${Math.round(value * 100)}%`; }
function signedPercent(value: number) { return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`; }

export function ResearchCard({ result, featured = false, compact = false, selected = false, onSelect }: { result: Result; featured?: boolean; compact?: boolean; selected?: boolean; onSelect?: () => void }) {
  const insights = result.insights;
  const latest = result.state.bars.at(-1)?.close;

  return (
    <article role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} onClick={onSelect} onKeyDown={(event) => { if (onSelect && (event.key === "Enter" || event.key === " ")) onSelect(); }} className={`overflow-hidden rounded-2xl border bg-slate-900 shadow-xl shadow-black/10 ${selected ? "border-cyan-400/60" : "border-slate-800"} ${featured ? "shadow-2xl shadow-cyan-950/20" : ""} ${onSelect ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between border-b border-slate-800 p-4">
        <div><p className="text-2xl font-semibold">{result.symbol}</p><p className="mt-1 text-sm text-slate-500">{latest ? `$${latest.toFixed(2)}` : "No price"}</p></div>
        {result.success && insights ? <div className="flex items-center gap-2"><SignalBadge signal={insights.action} /><span className="rounded bg-violet-400/15 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">Drex</span></div> : <SignalBadge signal="error" />}
      </div>
      <div className="p-4">
        <PriceChart bars={result.state.bars} />
        {result.success && insights ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="Confidence" value={percent(insights.actionConfidence)} />
              <Metric label="Risk" value={percent(insights.riskLevel)} />
              <Metric label="Evidence" value={percent(insights.evidenceSufficient)} />
            </div>
            <div className="mt-3 rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-200">
              <span className="font-semibold">Drex decision model</span>
              <span className="ml-2 text-violet-300/80">{insights.model}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <Metric label="Event" value={insights.eventType.replaceAll("_", " ")} />
              <Metric label="Impact" value={percent(insights.marketImpact)} />
              <Metric label="5m move" value={signedPercent(insights.features.return5m)} />
              <Metric label="30m move" value={signedPercent(insights.features.return30m)} />
              <Metric label="Volume vs avg" value={`${insights.features.volumeVsAverage.toFixed(2)}x`} />
              <Metric label="Primary risk" value={insights.primaryRisk.replaceAll("_", " ")} />
            </dl>
            {!compact && <details className="mt-3"><summary className="cursor-pointer text-xs font-medium text-violet-300">Drex agent panel (market · news · risk)</summary><div className="mt-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-slate-500">{["market", "news", "risk"].map((agent) => <div key={agent} className="rounded border border-slate-800 px-2 py-2"><span className="block text-slate-300">{agent}</span><span>complete</span></div>)}</div></details>}
            <details className="mt-4 group"><summary className="cursor-pointer text-sm font-medium text-cyan-300">Conclusions drawn</summary><ul className="mt-2 space-y-2 text-xs leading-5 text-slate-400">{insights.conclusions.map((conclusion) => <li key={conclusion}>• {conclusion}</li>)}</ul></details>
            <details className="mt-4 group"><summary className="cursor-pointer text-sm font-medium text-cyan-300">Related news ({result.state.news.length})</summary><div className="mt-3"><NewsPanel news={result.state.news} /></div></details>
          </>
        ) : <p className="mt-3 text-sm text-rose-300">{result.error ?? "Analysis unavailable."}</p>}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 flex-col gap-1"><dt className="truncate text-slate-500">{label}</dt><dd className="truncate text-slate-200">{value}</dd></div>;
}
