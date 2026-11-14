import { PriceChart } from "@/components/charts/PriceChart";
import { NewsPanel } from "./NewsPanel";
import { SignalBadge } from "./SignalBadge";
import { ArrowUpRight, ChevronRight, ShieldCheck } from "lucide-react";

type Result = {
  symbol: string;
  success: boolean;
  state: { bars: Array<{ timestamp: string; close: number }>; news: Array<{ id: string; headline: string; summary: string; source: string; url?: string; publishedAt: string }> };
  insights?: { action: string; actionConfidence: number; eventType: string; riskLevel: number; marketImpact: number; evidenceSufficient: number; primaryRisk: string; conclusions: string[]; features: { return5m: number; return30m: number; volumeVsAverage: number; volatility: number; barCount: number } };
  error?: string;
};

function percent(value: number) { return `${Math.round(value * 100)}%`; }
function signedPercent(value: number) { return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`; }

export function ResearchCard({ result, compact = false, featured = false, selected = false, onSelect }: { result: Result; compact?: boolean; featured?: boolean; selected?: boolean; onSelect?: () => void }) {
  const insights = result.insights;
  const latest = result.state.bars.at(-1)?.close;

  return (
    <article onClick={onSelect} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect?.(); }} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} className={`overflow-hidden rounded-2xl border bg-slate-900 shadow-xl shadow-black/10 transition ${featured ? "mb-2 border-cyan-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30" : selected ? "border-cyan-400/60 bg-slate-900 ring-1 ring-cyan-400/20" : "border-slate-800 hover:-translate-y-0.5 hover:border-slate-700"}`}>
      <div className="flex items-start justify-between border-b border-slate-800 p-4">
        <div><div className="flex items-center gap-2"><p className={featured ? "text-3xl font-semibold" : "text-xl font-semibold"}>{result.symbol}</p>{featured && <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Focused</span>}</div><p className="mt-1 text-sm text-slate-500">{latest ? `$${latest.toFixed(2)}` : "No price"}</p></div>
        <div className="flex items-center gap-2">{result.success && insights ? <SignalBadge signal={insights.action} /> : <SignalBadge signal="error" />}{!featured && <ChevronRight className="h-4 w-4 text-slate-600" />}</div>
      </div>
      <div className={featured ? "p-5" : "p-4"}>
        <PriceChart bars={result.state.bars} />
        {result.success && insights ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="Confidence" value={percent(insights.actionConfidence)} />
              <Metric label="Risk" value={percent(insights.riskLevel)} />
              <Metric label="Evidence" value={percent(insights.evidenceSufficient)} />
            </div>
            {!compact && <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <Metric label="Event" value={insights.eventType.replaceAll("_", " ")} />
              <Metric label="Impact" value={percent(insights.marketImpact)} />
              <Metric label="5m move" value={signedPercent(insights.features.return5m)} />
              <Metric label="30m move" value={signedPercent(insights.features.return30m)} />
              <Metric label="Volume vs avg" value={`${insights.features.volumeVsAverage.toFixed(2)}x`} />
              <Metric label="Primary risk" value={insights.primaryRisk.replaceAll("_", " ")} />
            </dl>}
            {!compact && <><div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-xs text-slate-300"><ShieldCheck className="h-4 w-4 text-emerald-300" />Evidence status: {percent(insights.evidenceSufficient)} sufficient</div><details open className="mt-4 group"><summary className="cursor-pointer text-sm font-medium text-cyan-300">Conclusions drawn</summary><ul className="mt-2 space-y-2 text-xs leading-5 text-slate-400">{insights.conclusions.map((conclusion) => <li key={conclusion}>• {conclusion}</li>)}</ul></details><details className="mt-4 group"><summary className="cursor-pointer text-sm font-medium text-cyan-300">Related news ({result.state.news.length})</summary><div className="mt-3"><NewsPanel news={result.state.news} /></div></details></>}
            {!featured && <p className="mt-3 flex items-center justify-end gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">Inspect symbol <ArrowUpRight className="h-3 w-3" /></p>}
          </>
        ) : <p className="mt-3 text-sm text-rose-300">{result.error ?? "Analysis unavailable."}</p>}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 flex-col gap-1"><dt className="truncate text-slate-500">{label}</dt><dd className="truncate text-slate-200">{value}</dd></div>;
}
