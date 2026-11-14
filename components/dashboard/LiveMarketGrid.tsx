"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveMarketSnapshot, MarketBar } from "@/lib/market/types";
import { PriceChart } from "@/components/charts/PriceChart";

type Props = { enabled: boolean; onNewNews?: (ids: string[]) => void };

export function LiveMarketGrid({ enabled, onNewNews }: Props) {
  const [snapshot, setSnapshot] = useState<LiveMarketSnapshot | null>(null);
  const [history, setHistory] = useState<Record<string, MarketBar[]>>({});
  const [error, setError] = useState<string | null>(null);
  const seenNews = useRef<Set<string> | null>(null);
  const onNewNewsRef = useRef(onNewNews);

  useEffect(() => {
    onNewNewsRef.current = onNewNews;
  }, [onNewNews]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/market/live", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Live market data unavailable");
        if (cancelled) return;
        const next = body as LiveMarketSnapshot;
        setSnapshot(next);
        setHistory((previous) => {
          const merged = { ...previous };
          for (const [symbol, bars] of Object.entries(next.barsBySymbol)) {
            const oldBars = merged[symbol] ?? [];
            const combined = [...oldBars, ...bars];
            merged[symbol] = combined.filter((bar, index, values) => values.findIndex((candidate) => candidate.timestamp === bar.timestamp) === index).slice(-120);
          }
          return merged;
        });

        const ids = next.news.map((article) => article.id);
        if (seenNews.current === null) seenNews.current = new Set(ids);
        else {
          const newIds = ids.filter((id) => !seenNews.current?.has(id));
          ids.forEach((id) => seenNews.current?.add(id));
          if (newIds.length) onNewNewsRef.current?.(newIds);
        }
        setError(null);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Live market data unavailable");
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [enabled]);

  if (!enabled) return null;
  if (error && !snapshot) return <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>;
  if (!snapshot) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-500">Connecting to live market data…</div>;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Live market standings</h2><p className="text-sm text-slate-500">Refreshing every 10 seconds · Alpaca IEX feed · no Drex calls</p></div>
        {error && <span className="text-xs text-amber-300">Last refresh failed; showing latest snapshot</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Object.keys(snapshot.quotesBySymbol).map((symbol) => <LiveSymbolCard key={symbol} symbol={symbol} quote={snapshot.quotesBySymbol[symbol]} bars={history[symbol] ?? snapshot.barsBySymbol[symbol] ?? []} />)}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="mb-3 text-sm font-medium text-slate-300">Incoming news monitor <span className="text-slate-500">({snapshot.news.length} recent)</span></p><div className="flex flex-wrap gap-2">{snapshot.news.slice(0, 8).map((article) => <span key={article.id} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{article.headline}</span>)}</div></div>
    </section>
  );
}

function LiveSymbolCard({ symbol, quote, bars }: { symbol: string; quote: LiveMarketSnapshot["quotesBySymbol"][string]; bars: MarketBar[] }) {
  const first = bars[0]?.close ?? quote.lastPrice;
  const change = first > 0 ? (quote.lastPrice - first) / first : 0;
  return <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-start justify-between"><div><h3 className="text-lg font-semibold">{symbol}</h3><p className="text-2xl font-medium text-slate-100">${quote.lastPrice.toFixed(2)}</p><p className={`text-xs ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{change >= 0 ? "+" : ""}{(change * 100).toFixed(2)}% since monitor start</p></div><div className="text-right text-xs text-slate-500"><p>Bid / Ask</p><p className="mt-1 font-mono text-slate-300">${quote.bidPrice.toFixed(2)} / ${quote.askPrice.toFixed(2)}</p></div></div><div className="mt-3"><PriceChart bars={bars} /></div><dl className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-xs"><Metric label="Spread" value={`$${quote.spread.toFixed(4)}`} /><Metric label="Spread %" value={`${(quote.spreadPercent * 100).toFixed(3)}%`} /><Metric label="Sizes" value={`${quote.bidSize} / ${quote.askSize}`} /></dl></article>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 text-slate-200">{value}</dd></div>; }
