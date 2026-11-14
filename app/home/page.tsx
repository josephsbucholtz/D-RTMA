"use client";

import { useState } from "react";

type Mode = "live" | "historical";

type Result = {
  symbol: string;
  success: boolean;
  state: { bars: Array<{ close: number }>; news: unknown[] };
  analysis?: Record<string, unknown>;
  error?: string;
};

type ResponseData = {
  mode: Mode;
  date?: string;
  generatedAt: string;
  results: Result[];
};

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function label(value: unknown) {
  return typeof value === "string" ? value.replaceAll("_", " ") : "—";
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("historical");
  const [date, setDate] = useState("2026-11-13");
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDemo() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...(mode === "historical" ? { date } : {}) }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Research request failed");
      }

      setData(body as ResponseData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
              D-RTMA research demo
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">One-day market replay</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Alpaca market data flows through the same normalization and Drex analysis path in live and historical modes.
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Research signals only. No trades are placed.
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400" htmlFor="mode">
                Data mode
              </label>
              <select id="mode" value={mode} onChange={(event) => setMode(event.target.value as Mode)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400">
                <option value="historical">Historical — one day</option>
                <option value="live">Live — trailing 24 hours</option>
              </select>
            </div>
            {mode === "historical" && (
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400" htmlFor="date">
                  Trading date
                </label>
                <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400" />
              </div>
            )}
            <button type="button" onClick={runDemo} disabled={loading} className="rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-50">
              {loading ? "Analyzing…" : "Run research demo"}
            </button>
          </div>
          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        </section>

        {data && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-300">{data.mode} mode</span>
              {data.date && <span>{data.date}</span>}
              <span>Updated {new Date(data.generatedAt).toLocaleString()}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {data.results.map((result) => {
                const analysis = result.analysis ?? {};
                const confidence = number(analysis.actionConfidence);
                const action = label(analysis.action);
                const close = result.state.bars.at(-1)?.close;

                return (
                  <article key={result.symbol} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-start justify-between">
                      <h2 className="text-xl font-semibold">{result.symbol}</h2>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${result.success ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>
                        {result.success ? action : "error"}
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-medium">{close ? `$${close.toFixed(2)}` : "No bar"}</p>
                    {result.success ? (
                      <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Confidence</dt><dd>{confidence === null ? "—" : `${Math.round(confidence * 100)}%`}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Event</dt><dd className="text-right">{label(analysis.event_type)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Risk</dt><dd>{number(analysis.risk_level) ?? "—"}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">News</dt><dd>{result.state.news.length}</dd></div>
                      </dl>
                    ) : <p className="mt-4 text-sm text-rose-300">{result.error}</p>}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
