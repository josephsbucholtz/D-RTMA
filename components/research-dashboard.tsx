"use client";

import { useState, type DragEvent } from "react";

type AgentStatus = "idle" | "working" | "done";
type Speed = "1x" | "10x" | "60x";

const agents: { name: string; role: string; initials: string; accent: string }[] = [
  { name: "Filings", role: "SEC & company docs", initials: "FI", accent: "bg-violet-100 text-violet-700" },
  { name: "News", role: "Narrative & catalysts", initials: "NE", accent: "bg-sky-100 text-sky-700" },
  { name: "Price", role: "Market structure", initials: "PR", accent: "bg-amber-100 text-amber-700" },
  { name: "Skeptic", role: "Contrarian review", initials: "SK", accent: "bg-rose-100 text-rose-700" },
  { name: "Lead", role: "Synthesis & policy", initials: "LE", accent: "bg-emerald-100 text-emerald-700" },
];

const findings = [
  { claim: "Cloud bookings grew 28% YoY, ahead of guidance", stance: "Supports", source: "Q3 earnings call", latency: "184 ms", tone: "text-emerald-700 bg-emerald-50" },
  { claim: "Enterprise pipeline remains concentrated in top 10 accounts", stance: "Caveat", source: "10-Q · Risk factors", latency: "241 ms", tone: "text-amber-700 bg-amber-50" },
  { claim: "Price holding above 50-day moving average", stance: "Supports", source: "Historical replay", latency: "96 ms", tone: "text-emerald-700 bg-emerald-50" },
  { claim: "Margin expansion is not yet visible in operating cash flow", stance: "Challenges", source: "Cash flow statement", latency: "207 ms", tone: "text-rose-700 bg-rose-50" },
];

function Icon({ name, size = 18 }: { name: "search" | "arrow" | "upload" | "clock" | "chevron" | "spark" | "check"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "chevron") return <svg {...common}><path d="m7 10 5 5 5-5" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /><path d="m19 17 .6 2.4L22 20l-2.4.6L19 23l-.6-2.4L16 20l2.4-.6L19 17Z" /></svg>;
  return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
}

export default function ResearchDashboard() {
  const [question, setQuestion] = useState("Should I increase exposure to NVDA after its next earnings report?");
  const [speed, setSpeed] = useState<Speed>("10x");
  const [statuses, setStatuses] = useState<AgentStatus[]>(["done", "done", "done", "done", "done"]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const runResearch = () => {
    setStatuses(["working", "working", "working", "working", "working"]);
    window.setTimeout(() => setStatuses(["done", "done", "done", "done", "done"]), 900);
  };

  const acceptFile = (file?: File) => {
    if (file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf")) setFileName(file.name);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm"><Icon name="spark" size={18} /></div>
            <div><p className="text-[15px] font-semibold tracking-tight">D-RTMA</p><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Decision research terminal</p></div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500"><span className="hidden sm:inline">Research workspace</span><div className="h-7 w-7 rounded-full bg-slate-200 text-center pt-1.5 font-semibold text-slate-600">DG</div></div>
        </header>

        <section className="py-9 sm:py-11">
          <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Market intelligence / Workspace 01</p><h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">What are you researching?</h1><p className="mt-2 text-sm text-slate-500">Ask a question and let the research team build an evidence-backed signal.</p></div>
            <div className="flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> HISTORICAL MODE</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex flex-1 items-center gap-3 px-3"><Icon name="search" size={19} /><input aria-label="Research question" value={question} onChange={(event) => setQuestion(event.target.value)} className="w-full bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" /></div><button onClick={runResearch} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">Research <Icon name="arrow" size={16} /></button></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="font-medium">Replay speed</span>{(["1x", "10x", "60x"] as Speed[]).map((option) => <button key={option} onClick={() => setSpeed(option)} className={`rounded-lg px-2.5 py-1.5 font-semibold ${speed === option ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-200"}`}>{option}</button>)}<span className="ml-1 flex items-center gap-1.5 border-l border-slate-200 pl-3"><Icon name="clock" size={14} /> Replaying Nov 14, 2024 · 14:35:00 UTC</span></div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Research team</h2><p className="mt-1 text-xs text-slate-500">Five focused agents, one explainable output</p></div><span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All systems ready</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{agents.map((agent, index) => <div key={agent.name} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-start justify-between"><div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold ${agent.accent}`}>{agent.initials}</div><span className={`mt-1 h-2 w-2 rounded-full ${statuses[index] === "working" ? "animate-pulse bg-indigo-500" : statuses[index] === "done" ? "bg-emerald-500" : "bg-slate-300"}`} title={statuses[index]} /></div><p className="mt-3 text-xs font-semibold">{agent.name}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-400">{agent.role}</p><p className={`mt-3 text-[10px] font-medium ${statuses[index] === "working" ? "text-indigo-600" : statuses[index] === "done" ? "text-emerald-600" : "text-slate-400"}`}>{statuses[index]}</p></div>)}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Live findings</h2><p className="mt-1 text-xs text-slate-500">Evidence collected from the current historical replay</p></div><span className="text-[11px] font-medium text-slate-400">04 findings</span></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><th className="pb-3 pr-4">Claim</th><th className="pb-3 pr-4">Stance</th><th className="pb-3 pr-4">Source</th><th className="pb-3 text-right">Latency</th></tr></thead><tbody>{findings.map((finding) => <tr key={finding.claim} className="border-b border-slate-50 last:border-0"><td className="py-3 pr-4 text-xs font-medium text-slate-700">{finding.claim}</td><td className="py-3 pr-4"><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${finding.tone}`}>{finding.stance}</span></td><td className="py-3 pr-4 text-xs text-slate-500">{finding.source}</td><td className="py-3 text-right font-mono text-[11px] text-slate-400">{finding.latency}</td></tr>)}</tbody></table></div></div>
          </div>

          <aside className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Research signal</p><p className="mt-1 text-xs text-slate-400">NVDA · historical replay</p></div><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">PUBLISHABLE</span></div><div className="px-5 py-6"><div className="flex items-end justify-between"><div><p className="text-4xl font-semibold tracking-[-0.05em] text-emerald-400">BUY</p><p className="mt-1 text-xs text-slate-400">Research signal, not a trade</p></div><div className="text-right"><p className="text-3xl font-semibold">78%</p><p className="text-[10px] uppercase tracking-wider text-slate-500">confidence</p></div></div><div className="mt-7 space-y-4"><div><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-slate-400">Evidence strength</span><span className="font-medium text-emerald-300">Sufficient</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 w-[82%] rounded-full bg-emerald-400" /></div></div><div><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-slate-400">Risk level</span><span className="font-medium text-amber-300">Moderate</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 w-[46%] rounded-full bg-amber-400" /></div></div></div><div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4"><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Primary risk</p><p className="mt-1 text-xs font-medium text-slate-200">Valuation compression</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-500">As of</p><p className="mt-1 text-xs font-medium text-slate-200">14 Nov 2024, 14:35 UTC</p></div></div></div></div>
            <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`rounded-2xl border border-dashed p-5 text-center transition ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-white"}`}><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon name="upload" size={19} /></div><p className="mt-3 text-sm font-semibold">Add a filing or report</p><p className="mt-1 text-xs text-slate-500">Drop a PDF here to add it to the evidence set</p><label className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">Browse files <Icon name="arrow" size={13} /><input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => acceptFile(event.target.files?.[0])} /></label>{fileName && <p className="mt-3 truncate rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">{fileName} added</p>}</div>
          </aside>
        </section>
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400 sm:flex-row"><span>Signals are for research and educational purposes only.</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Mock data · No live market connection</span></footer>
      </div>
    </main>
  );
}
