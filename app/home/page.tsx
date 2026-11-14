"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Clock } from "@/components/dashboard/Clock";
import { LiveMarketGrid } from "@/components/dashboard/LiveMarketGrid";
import { ResearchCard } from "@/components/dashboard/ResearchCard";

type Mode = "live" | "historical";
type Result = Parameters<typeof ResearchCard>[0]["result"];
type ResponseData = { mode: Mode; date?: string; generatedAt: string; results: Result[] };

export default function Home() {
  const [mode, setMode] = useState<Mode>("live");
  const [date, setDate] = useState("2026-11-13");
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoAnalyzeNews, setAutoAnalyzeNews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runResearch(requestedMode: Mode = mode) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: requestedMode, ...(requestedMode === "historical" ? { date } : {}) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Research request failed");
      setData(body as ResponseData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-7 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400">D-RTMA / research terminal</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Market context, made explainable.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Compare a one-day historical replay with the latest trailing 24-hour market context. Drex is called only when you press Run research.</p>
          </div>
          <Clock />
        </header>

        <section className="mb-7 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/20">
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
              {mode === "live" && <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={autoAnalyzeNews} onChange={(event) => setAutoAnalyzeNews(event.target.checked)} className="accent-cyan-400" /> Analyze new news with Drex</label>}
              <button type="button" onClick={() => void runResearch()} disabled={loading} className="rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-50">{loading ? "Analyzing with Drex…" : "Run research"}</button>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">Live prices, quotes, spread, and news refresh automatically. Drex stays idle unless you run research or enable the news trigger.</p>
          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        </section>

        <LiveMarketGrid enabled={mode === "live"} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} onNewNews={() => { if (autoAnalyzeNews && !loading) void runResearch("live"); }} />

        {data ? (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-300">{data.mode} mode</span>
              {data.date && <span>{data.date}</span>}
              <span>Last run {new Date(data.generatedAt).toLocaleString()}</span>
              <span>{data.results.filter((result) => result.success).length}/{data.results.length} symbols analyzed</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {data.results.map((result) => <ResearchCard key={result.symbol} result={result} />)}
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
