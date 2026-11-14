"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { BarChart3, CircleDot, RefreshCw } from "lucide-react";
import { Clock } from "@/components/dashboard/Clock";
import { ResearchCard } from "@/components/dashboard/ResearchCard";

type Mode = "live" | "historical";
type Result = Parameters<typeof ResearchCard>[0]["result"];
type ResponseData = { mode: Mode; date?: string; generatedAt: string; results: Result[] };

export default function Home() {
  const [mode, setMode] = useState<Mode>("historical");
  const [date, setDate] = useState("2026-11-13");
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  async function runResearch() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...(mode === "historical" ? { date } : {}) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Research request failed");
      setData(body as ResponseData);
      setSelectedSymbol((current) => current ?? body.results?.[0]?.symbol ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const selectedResult = data?.results.find((result) => result.symbol === selectedSymbol) ?? data?.results[0];
  const successfulResults = data?.results.filter((result) => result.success && result.insights) ?? [];

  function selectSymbol(symbol: string) {
    setSelectedSymbol(symbol);
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-7 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400"><span className="status-dot" />D-RTMA / research terminal</div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Market context, made explainable.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Compare a one-day historical replay with the latest trailing 24-hour market context. Drex is called only when you press Run research.</p>
          </div>
          <div className="hidden items-center gap-5 sm:flex"><div className="h-10 w-px bg-slate-800" /><Clock /></div>
        </header>

        <section className="mb-7 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Data mode">
                <select value={mode} onChange={(event) => setMode(event.target.value as Mode)} className="control">
                  <option value="historical">Historical — one day</option>
                  <option value="live">Live — trailing 24 hours</option>
                </select>
              </Field>
              {mode === "historical" && <Field label="Trading date"><input className="control" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 sm:inline">Manual refresh · no background polling</span>
              <button type="button" onClick={runResearch} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}{loading ? "Analyzing with Drex…" : data ? "Refresh research" : "Run research"}</button>
            </div>
          </div>
          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        </section>

        {data ? (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-300"><CircleDot className="h-3 w-3" />{data.mode} mode</span>
              {data.date && <span>{data.date}</span>}
              <span>Last run {new Date(data.generatedAt).toLocaleString()}</span>
              <span>{data.results.filter((result) => result.success).length}/{data.results.length} symbols analyzed</span>
            </div>

            {selectedResult && <div ref={detailPanelRef} className="scroll-mt-6"><ResearchCard result={selectedResult} featured /></div>}

            <div className="mb-3 mt-8 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-200">Coverage universe</p><p className="mt-1 text-xs text-slate-500">Select an instrument to inspect its research context</p></div>
              <span className="text-xs text-slate-500">{successfulResults.length} ready</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {data.results.map((result) => <ResearchCard key={result.symbol} result={result} compact selected={result.symbol === selectedResult?.symbol} onSelect={() => selectSymbol(result.symbol)} />)}
            </div>
          </>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-200">Ready when you are.</p>
            <p className="mt-2 text-sm text-slate-500">Choose a mode and run a research pass to load prices, charts, Drex confidence, risk, event classifications, conclusions, and news.</p>
          </section>
        )}

        <footer className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-600">Research signals are informational and historical. This application does not place trades or guarantee outcomes.</footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>{children}</label>;
}
