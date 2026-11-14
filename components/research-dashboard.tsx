"use client";

import { useEffect, useState, type DragEvent } from "react";
import { runResearch, uploadDocument, type DataMode, type Finding, type ResearchData } from "./api";

type AgentStatus = "idle" | "working" | "done";
type Speed = "1x" | "10x" | "60x";
type UploadStatus = "idle" | "uploading" | "parsed";

const agents = [
  { name: "Filings", role: "SEC & company docs", initials: "FI" },
  { name: "News", role: "Narrative & catalysts", initials: "NE" },
  { name: "Price", role: "Market structure", initials: "PR" },
  { name: "Skeptic", role: "Contrarian review", initials: "SK" },
  { name: "Lead", role: "Synthesis & policy", initials: "LE" },
];

const pricePoints = [
  137.3, 139.1, 138.4, 141.8, 144.2, 142.7, 146.8, 149.4, 147.9, 151.6,
  153.3, 151.8, 155.4, 158.2, 157.1, 160.8, 163.6, 166.1, 164.7, 168.9,
  171.4, 170.2, 173.8, 176.5, 179.2, 181.1, 184.6, 183.7, 187.5, 190.2,
];

function Icon({ name, size = 18 }: { name: "search" | "arrow" | "upload" | "clock" | "spark" | "check" | "bolt" | "file" | "play" | "pause"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /><path d="m19 17 .6 2.4L22 20l-2.4.6L19 23l-.6-2.4L16 20l2.4-.6L19 17Z" /></svg>;
  if (name === "bolt") return <svg {...common}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></svg>;
  if (name === "file") return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>;
  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" /></svg>;
  if (name === "pause") return <svg {...common}><path d="M8 5v14M16 5v14" /></svg>;
  return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
}

function stanceStyle(stance: Finding["stance"]) {
  if (stance === "bullish") return { label: "BULLISH", className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400" };
  if (stance === "bearish") return { label: "BEARISH", className: "border-red-400/20 bg-red-400/10 text-red-300", dot: "bg-red-400" };
  return { label: "NEUTRAL", className: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300", dot: "bg-yellow-300" };
}

function chartCoordinates(points: number[], width: number, height: number) {
  const min = Math.min(...points) - 2;
  const max = Math.max(...points) + 2;
  return points.map((point, index) => ({ x: (index / (points.length - 1)) * width, y: height - ((point - min) / (max - min)) * height }));
}

export default function ResearchDashboard() {
  const [question, setQuestion] = useState("Should I increase exposure to NVDA after its next earnings report?");
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [statuses, setStatuses] = useState<AgentStatus[]>(["idle", "idle", "idle", "idle", "idle"]);
  const [isResearching, setIsResearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [documentFinding, setDocumentFinding] = useState<Finding | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [speed, setSpeed] = useState<Speed>("10x");
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(pricePoints.length - 1);
  const [documentDropIndex, setDocumentDropIndex] = useState<number | null>(null);

  const executeResearch = async (researchQuestion: string) => {
    setIsResearching(true);
    setErrorMessage("");
    setStatuses(["working", "working", "working", "working", "working"]);
    setResearch(null);
    const result = await runResearch("NVDA", researchQuestion, "historical" satisfies DataMode);
    setResearch(result.data);
    if (result.error) setErrorMessage(`Research route unavailable — showing mock data (${result.code ?? "fallback"}).`);
    window.setTimeout(() => setStatuses(["done", "done", "done", "done", "done"]), 650);
    setIsResearching(false);
  };

  useEffect(() => {
    if (!isPlaying) return undefined;
    const intervals: Record<Speed, number> = { "1x": 1000, "10x": 260, "60x": 70 };
    const timer = window.setInterval(() => {
      setReplayIndex((index) => {
        if (index >= pricePoints.length - 1) {
          setIsPlaying(false);
          return index;
        }
        return index + 1;
      });
    }, intervals[speed]);
    return () => window.clearInterval(timer);
  }, [isPlaying, speed]);

  const handleFile = async (file?: File) => {
    if (!file || (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf"))) return;
    setFileName(file.name);
    setUploadStatus("uploading");
    setErrorMessage("");
    const result = await uploadDocument(file);
    setUploadStatus("parsed");
    setDocumentText(result.data.text);
    setDocumentFinding({ claim: `Document added: ${result.data.text.slice(0, 92)}…`, stance: "neutral", source: result.data.filename, latency: "38 ms" });
    setDocumentDropIndex(replayIndex);
    if (result.error) setErrorMessage(`Document route unavailable — parsed with mock data (${result.code ?? "fallback"}).`);
    await executeResearch(`${question}\n\nDocument context from ${result.data.filename}:\n${result.data.text}`);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  };

  const shownFindings = research ? [...research.findings, ...(documentFinding ? [documentFinding] : [])] : [];
  const chartPoints = chartCoordinates(pricePoints.slice(0, replayIndex + 1), 640, 185);
  const chartPath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const currentPrice = pricePoints[replayIndex];

  return (
    <main className="min-h-screen bg-[#071016] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <style>{`@keyframes finding-in { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <div className="mx-auto max-w-[1540px] px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-slate-700/60 pb-6"><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.22)]"><Icon name="spark" size={21} /></div><div><p className="text-xl font-bold tracking-[-0.04em] text-white">D-RTMA</p><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Decision research terminal</p></div></div><div className="hidden items-center gap-3 text-right sm:flex"><div><p className="text-xs font-semibold text-slate-300">HACKATHON DEMO</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Mock data environment</p></div><div className="h-9 w-9 rounded-full border border-slate-600 bg-slate-800 pt-2 text-center text-xs font-bold text-cyan-300">DG</div></div></header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 py-4"><div className="flex items-center gap-2 text-xs font-bold tracking-wider"><span className="rounded-md bg-slate-800 px-2.5 py-1.5 text-slate-400">LIVE</span><span className="text-slate-600">/</span><span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1.5 text-cyan-300">HISTORICAL</span><span className="ml-2 text-[10px] font-medium uppercase tracking-widest text-slate-500">active mode</span></div><div className="flex items-center gap-2 text-xs text-slate-400"><span>Replay speed</span>{(["1x", "10x", "60x"] as Speed[]).map((option) => <button key={option} onClick={() => setSpeed(option)} className={`rounded-md px-3 py-1.5 font-bold transition ${speed === option ? "bg-cyan-300 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{option}</button>)}<span className="ml-2 hidden items-center gap-1.5 border-l border-slate-700 pl-3 sm:flex"><Icon name="clock" size={14} /> 14 Nov 2024 · 14:35 UTC</span></div></div>

        <section className="py-8 sm:py-10"><div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Workspace 01 / Market intelligence</p><h1 className="text-3xl font-bold tracking-[-0.05em] text-white sm:text-5xl">What are you researching?</h1><p className="mt-3 max-w-2xl text-base text-slate-400">Ask a question. Five specialized agents turn the evidence into an explainable research signal.</p></div><div className="flex items-center gap-2 self-start rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> HISTORICAL REPLAY</div></div><div className="rounded-2xl border border-slate-700 bg-[#0c1820] p-2 shadow-2xl shadow-black/20"><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex flex-1 items-center gap-3 px-4"><Icon name="search" size={22} /><input aria-label="Research question" value={question} onChange={(event) => setQuestion(event.target.value)} className="w-full bg-transparent py-4 text-base text-white outline-none placeholder:text-slate-500" /></div><button disabled={isResearching} onClick={() => void executeResearch(question)} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{isResearching ? "ANALYZING…" : "RUN RESEARCH"} <Icon name="arrow" size={17} /></button></div></div></section>

        {errorMessage && <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200"><span className="font-bold">Fallback active:</span> {errorMessage}</div>}

        {isResearching && <div className="mb-6 rounded-3xl border border-cyan-300/20 bg-[#0c1820] p-8 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-300" /><p className="mt-4 text-lg font-bold text-white">Agents are reviewing the evidence…</p><p className="mt-1 text-sm text-slate-400">Normalizing filings, news, price, and risk context</p></div>}

        {!isResearching && research && <section className="mb-6 rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-[#112934] via-[#0d2029] to-[#0b161d] p-6 shadow-[0_0_70px_rgba(34,211,238,0.08)] sm:p-9"><div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><div className="mb-4 flex items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Research signal</span><span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-300">{research.evidenceSufficient ? "EVIDENCE SUFFICIENT" : "EVIDENCE INSUFFICIENT"}</span></div><div className="flex items-end gap-5"><p className="text-6xl font-black uppercase tracking-[-0.07em] text-emerald-300 sm:text-8xl">{research.action}</p><div className="pb-2"><p className="text-sm font-semibold text-slate-200">{research.symbol} · research signal</p><p className="mt-1 text-xs text-slate-400">Not a trade instruction · Historical replay</p></div></div></div><div className="flex items-end gap-3"><div className="text-right"><p className="text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl">{research.confidence}<span className="text-3xl text-cyan-300">%</span></p><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">confidence</p></div><div className="mb-1 h-14 w-px bg-slate-700" /><div className="pb-1"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">As of</p><p className="mt-1 text-sm font-semibold text-white">{research.timestamp}</p></div></div></div><div className="mt-8 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-[1fr_1fr_0.8fr]"><div><div className="mb-2 flex justify-between text-xs font-bold"><span className="text-slate-300">Confidence strength</span><span className="text-cyan-300">{research.confidence} / 100</span></div><div className="h-3 rounded-full bg-slate-700/70"><div className="h-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.45)]" style={{ width: `${research.confidence}%` }} /></div></div><div><div className="mb-2 flex justify-between text-xs font-bold"><span className="text-slate-300">Risk indicator</span><span className="uppercase text-yellow-300">{research.risk}</span></div><div className="flex gap-1.5"><span className="h-3 flex-1 rounded-full bg-emerald-400" /><span className={`h-3 flex-1 rounded-full ${research.risk === "low" ? "bg-emerald-400" : "bg-yellow-300"}`} /><span className={`h-3 flex-1 rounded-full ${research.risk === "high" ? "bg-red-400" : research.risk === "moderate" ? "bg-yellow-300" : "bg-slate-700"}`} /><span className="h-3 flex-1 rounded-full bg-slate-700" /><span className="h-3 flex-1 rounded-full bg-slate-700" /></div></div><div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary risk</p><p className="mt-1 text-sm font-semibold text-slate-200">{research.primaryRisk}</p></div></div></section>}

        {!isResearching && !research && <div className="mb-6 rounded-3xl border border-dashed border-slate-700 bg-[#0c1820] p-12 text-center"><p className="text-lg font-bold text-white">No research signal yet</p><p className="mt-2 text-sm text-slate-400">Run a question to populate the research workspace.</p></div>}

        <section className="mb-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]"><div className="rounded-2xl border border-slate-700 bg-[#0c1820] p-5 sm:p-6"><div className="mb-5 flex items-end justify-between"><div><h2 className="text-lg font-bold text-white">Research team</h2><p className="mt-1 text-xs text-slate-400">Five agents · one decision</p></div><span className="flex items-center gap-2 text-xs font-bold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {isResearching ? "WORKING" : "READY"}</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-2">{agents.map((agent, index) => { const status = statuses[index]; return <div key={agent.name} className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3 transition hover:border-cyan-300/40"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-black text-cyan-300">{agent.initials}</div>{status === "done" ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Icon name="check" size={14} /></span> : <span className={`h-3 w-3 rounded-full ${status === "working" ? "animate-pulse bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" : "bg-slate-600"}`} />}</div><p className="mt-3 text-sm font-bold text-white">{agent.name}</p><p className="mt-1 text-[11px] text-slate-500">{agent.role}</p><p className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${status === "done" ? "text-emerald-300" : status === "working" ? "text-cyan-300" : "text-slate-500"}`}>{status}</p></div>; })}</div></div><div className="rounded-2xl border border-slate-700 bg-[#0c1820] p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-white">Live findings</h2><p className="mt-1 text-xs text-slate-400">Evidence arriving from the historical replay</p></div><div className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-200"><Icon name="bolt" size={15} /> 5 agents decided in 38 ms</div></div><div className="space-y-2">{!research && !isResearching ? <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">No findings to display yet.</div> : shownFindings.map((finding) => { const tone = stanceStyle(finding.stance); return <div key={`${finding.source}-${finding.claim}`} className="grid gap-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 sm:grid-cols-[1fr_auto] sm:items-center" style={{ animation: "finding-in 450ms ease-out" }}><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md border px-2 py-1 text-[10px] font-black tracking-wider ${tone.className}`}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />{tone.label}</span><span className="text-xs text-slate-500">{finding.source}</span></div><p className="mt-2 text-sm font-semibold leading-5 text-slate-200 sm:text-base">{finding.claim}</p></div><div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 sm:justify-end"><Icon name="clock" size={14} /> {finding.latency}</div></div>; })}</div></div></section>

        <section className="mb-6 rounded-2xl border border-slate-700 bg-[#0c1820] p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-3"><h2 className="text-lg font-bold text-white">Historical replay</h2><span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">NVDA / price</span></div><p className="mt-1 text-xs text-slate-400">Step through mock price points and inspect when evidence entered the timeline.</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex items-center rounded-lg bg-slate-800 p-1">{(["1x", "10x", "60x"] as Speed[]).map((option) => <button key={option} onClick={() => setSpeed(option)} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${speed === option ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"}`}>{option}</button>)}</div><button aria-label={isPlaying ? "Pause replay" : "Play replay"} onClick={() => setIsPlaying((playing) => !playing)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-slate-950 transition hover:bg-cyan-200"><Icon name={isPlaying ? "pause" : "play"} size={16} /></button><span className="text-sm font-bold text-white">${currentPrice.toFixed(2)}</span></div></div><div className="overflow-hidden rounded-xl border border-slate-800 bg-[#08131a] p-3"><svg className="h-44 w-full" viewBox="0 0 640 185" preserveAspectRatio="none" role="img" aria-label="Mock historical price chart"><defs><linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#67e8f9" stopOpacity="0.25" /><stop offset="100%" stopColor="#67e8f9" stopOpacity="0" /></linearGradient></defs><path d={`${chartPath} L 640 185 L 0 185 Z`} fill="url(#price-fill)" /><path d={chartPath} fill="none" stroke="#67e8f9" strokeWidth="3" vectorEffect="non-scaling-stroke" />{documentDropIndex !== null && documentDropIndex <= replayIndex && <circle cx={chartCoordinates(pricePoints.slice(0, documentDropIndex + 1), 640, 185).at(-1)?.x} cy={chartCoordinates(pricePoints.slice(0, documentDropIndex + 1), 640, 185).at(-1)?.y} r="6" fill="#facc15" stroke="#071016" strokeWidth="3" vectorEffect="non-scaling-stroke" />}<circle cx={chartPoints.at(-1)?.x} cy={chartPoints.at(-1)?.y} r="5" fill="#67e8f9" stroke="#071016" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg><div className="mt-2 flex items-center justify-between text-[10px] font-medium text-slate-500"><span>11:00</span><span className="flex items-center gap-1.5 text-yellow-300">{documentDropIndex !== null && <><span className="h-2 w-2 rounded-full bg-yellow-300" /> document dropped</>}</span><span>14:35 UTC</span></div></div><div className="mt-4 flex items-center gap-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Replay</span><input aria-label="Replay progress" type="range" min="0" max={pricePoints.length - 1} value={replayIndex} onChange={(event) => { setReplayIndex(Number(event.target.value)); setIsPlaying(false); }} className="h-2 flex-1 accent-cyan-300" /><span className="w-12 text-right font-mono text-xs text-slate-400">{replayIndex + 1}/{pricePoints.length}</span></div></section>

        <section className="grid gap-6 pb-8 lg:grid-cols-[1fr_0.55fr]"><div className={`rounded-2xl border border-dashed p-6 text-center transition sm:p-8 ${isDragging ? "border-cyan-300 bg-cyan-300/10" : "border-slate-600 bg-[#0c1820]"}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-cyan-300"><Icon name="upload" size={22} /></div><p className="mt-4 text-base font-bold text-white">Add a filing or report</p><p className="mt-1 text-sm text-slate-400">Drop a PDF to add it to the evidence set</p>{uploadStatus === "uploading" ? <p className="mt-4 text-sm font-bold text-cyan-300">Uploading…</p> : uploadStatus === "parsed" ? <p className="mt-4 text-sm font-bold text-emerald-300">parsed: {fileName}</p> : <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200">Browse PDF <Icon name="arrow" size={15} /><input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} /></label>}{documentText && <p className="mx-auto mt-4 max-w-xl rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-left text-xs leading-5 text-slate-300"><span className="font-bold text-cyan-300">Parsed text · first 300 characters</span><br />{documentText.slice(0, 300)}</p>}</div><div className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-[#0c1820] p-6"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><Icon name="spark" size={20} /></div><div><p className="text-sm font-bold text-white">Explainable by design</p><p className="mt-1 text-xs leading-5 text-slate-400">Every research signal keeps its confidence, risk, evidence status, and source trail visible.</p></div></div></section>

        <footer className="flex flex-col justify-between gap-2 border-t border-slate-800 py-5 text-xs text-slate-500 sm:flex-row"><span>Research and educational use only · No brokerage execution</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Mock data · No live market connection</span></footer>
      </div>
    </main>
  );
}
