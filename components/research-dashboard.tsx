"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { fetchMarketData, runResearch, uploadDocument, type DataMode, type Finding, type MarketData, type ResearchData } from "./api";
import { detectTicker, TICKERS, type Ticker } from "./mock-scenarios";

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

function Icon({ name, size = 18 }: { name: "search" | "arrow" | "upload" | "clock" | "spark" | "check" | "bolt" | "file" | "play" | "pause" | "reset"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /></svg>;
  if (name === "bolt") return <svg {...common}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></svg>;
  if (name === "file") return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>;
  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" /></svg>;
  if (name === "pause") return <svg {...common}><path d="M8 5v14M16 5v14" /></svg>;
  if (name === "reset") return <svg {...common}><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 5v5h5" /></svg>;
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
  return points.map((point, index) => ({ x: (index / Math.max(1, points.length - 1)) * width, y: height - ((point - min) / (max - min)) * height }));
}

export default function ResearchDashboard() {
  const [question, setQuestion] = useState("");
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [statuses, setStatuses] = useState<AgentStatus[]>(["idle", "idle", "idle", "idle", "idle"]);
  const [isResearching, setIsResearching] = useState(false);
  const [signalVisible, setSignalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [speed, setSpeed] = useState<Speed>("10x");
  const [mode, setMode] = useState<DataMode>("historical");
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [documentText, setDocumentText] = useState("");
  const [fileName, setFileName] = useState("");
  const [pendingDocument, setPendingDocument] = useState<{ filename: string; text: string } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [documentDropIndex, setDocumentDropIndex] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!isPlaying || !market) return undefined;
    const delay: Record<Speed, number> = { "1x": 900, "10x": 260, "60x": 80 };
    const timer = window.setInterval(() => setReplayIndex((index) => {
      if (index >= market.bars.length - 1) {
        setIsPlaying(false);
        return index;
      }
      return index + 1;
    }), delay[speed]);
    return () => window.clearInterval(timer);
  }, [isPlaying, market, speed]);

  const reset = () => {
    clearTimers();
    setQuestion("");
    setResearch(null);
    setMarket(null);
    setSignalVisible(false);
    setFindings([]);
    setStatuses(["idle", "idle", "idle", "idle", "idle"]);
    setIsResearching(false);
    setErrorMessage("");
    setAnimatedConfidence(0);
    setReplayIndex(0);
    setIsPlaying(false);
    setDocumentText("");
    setFileName("");
    setPendingDocument(null);
    setUploadStatus("idle");
    setDocumentDropIndex(null);
  };

  const animateSignal = (scenario: ResearchData) => {
    setAnimatedConfidence(0);
    const steps = 36;
    for (let step = 1; step <= steps; step += 1) {
      timers.current.push(window.setTimeout(() => setAnimatedConfidence(Math.round((scenario.confidence / steps) * step)), step * 22));
    }
  };

  const runSequence = async (ticker: Ticker, researchQuestion: string, extraFinding?: Finding) => {
    clearTimers();
    setIsResearching(true);
    setResearch(null);
    setFindings([]);
    setStatuses(["idle", "idle", "idle", "idle", "idle"]);
    setAnimatedConfidence(0);
    setReplayIndex(0);
    setIsPlaying(false);
    setErrorMessage("");
    const marketResult = await fetchMarketData(ticker, mode);
    setMarket(marketResult.data);
    if (marketResult.error) setErrorMessage("Using recorded data");
    const result = await runResearch(ticker, researchQuestion, "historical");
    const scenario = result.data;
    setResearch(scenario);
    setSignalVisible(false);
    if (result.error) setErrorMessage("Mock scenario fallback active.");
    const stagger: Record<Speed, number> = { "1x": 850, "10x": 400, "60x": 120 };
    const finishOffset: Record<Speed, number> = { "1x": 620, "10x": 290, "60x": 85 };
    const sequenceDelay = stagger[speed];
    scenario.findings.forEach((finding, index) => {
      timers.current.push(window.setTimeout(() => {
        setStatuses((current) => current.map((status, statusIndex) => statusIndex === index ? "working" : status));
      }, index * sequenceDelay));
      timers.current.push(window.setTimeout(() => {
        setStatuses((current) => current.map((status, statusIndex) => statusIndex === index ? "done" : status));
        setFindings((current) => [...current, finding]);
        setReplayIndex(Math.min(marketResult.data.bars.length - 1, Math.round(((index + 1) / scenario.findings.length) * (marketResult.data.bars.length - 1))));
        if (index === scenario.findings.length - 1) {
          if (extraFinding) setFindings((current) => [...current, extraFinding]);
          setIsResearching(false);
          setSignalVisible(true);
          animateSignal(scenario);
        }
      }, index * sequenceDelay + finishOffset[speed]));
    });
  };

  const handleResearch = () => {
    const ticker = detectTicker(question);
    if (!ticker) {
      setErrorMessage("Try a ticker like NVDA, AAPL, TSLA or SNDK");
      return;
    }
    const extraFinding = pendingDocument ? { claim: `Document added: ${pendingDocument.text.slice(0, 92)}…`, stance: "neutral" as const, source: pendingDocument.filename, latency: "38 ms" } : undefined;
    setPendingDocument(null);
    void runSequence(ticker, question, extraFinding);
  };

  const handleFile = async (file?: File) => {
    if (!file || (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf"))) return;
    const ticker = detectTicker(question);
    setFileName(file.name);
    setUploadStatus("uploading");
    const result = await uploadDocument(file);
    setUploadStatus("parsed");
    setDocumentText(result.data.text);
    setPendingDocument(result.data);
    setDocumentDropIndex(replayIndex);
    if (!ticker) {
      setErrorMessage("Document parsed. Choose a ticker below or add one to your question to start research.");
      return;
    }
    const documentFinding: Finding = { claim: `Document added: ${result.data.text.slice(0, 92)}…`, stance: "neutral", source: result.data.filename, latency: "38 ms" };
    setPendingDocument(null);
    await runSequence(ticker, `${question}\nDocument context: ${result.data.text}`, documentFinding);
  };

  const analyzeWithTicker = (ticker: Ticker) => {
    const nextQuestion = question || `Should I research ${ticker}?`;
    setQuestion(nextQuestion);
    const extraFinding = pendingDocument ? { claim: `Document added: ${pendingDocument.text.slice(0, 92)}…`, stance: "neutral" as const, source: pendingDocument.filename, latency: "38 ms" } : undefined;
    setPendingDocument(null);
    void runSequence(ticker, nextQuestion, extraFinding);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  };

  const detectedTicker = detectTicker(question);
  const displayedTicker = detectedTicker ?? research?.symbol ?? null;
  const chartSeries = market ? [...market.contextBars, ...market.bars.slice(0, replayIndex + 1)] : [];
  const chartPoints = chartSeries.length ? chartCoordinates(chartSeries.map((bar) => bar.close), 640, 175) : [];
  const contextCount = market?.contextBars.length ?? 0;
  const contextPoints = chartPoints.slice(0, contextCount);
  const replayPoints = chartPoints.slice(Math.max(0, contextCount - 1));
  const toPath = (points: { x: number; y: number }[]) => points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const contextPath = toPath(contextPoints);
  const replayPath = toPath(replayPoints);
  const documentPoint = documentDropIndex !== null && chartPoints[contextCount + documentDropIndex] ? chartPoints[contextCount + documentDropIndex] : null;
  const latencyTotal = findings.reduce((total, finding) => total + Number.parseInt(finding.latency, 10), 0);
  const currentPrice = market?.bars[replayIndex]?.close ?? 0;
  const statusBadge = mode === "historical" ? "HISTORICAL" : market?.marketOpen ? "LIVE" : "MARKET CLOSED";

  return (
    <main className="min-h-screen bg-[#071016] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <style>{`@keyframes finding-in { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } } @keyframes signal-in { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      <div className="mx-auto max-w-[1540px] px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-slate-700/60 pb-6"><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.22)]"><Icon name="spark" size={21} /></div><div><p className="text-xl font-bold tracking-[-0.04em] text-white">D-RTMA</p><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Decision research terminal</p></div></div><button onClick={reset} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-cyan-300/50 hover:text-cyan-300"><Icon name="reset" size={15} /> RESET</button></header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 py-4"><div className="flex items-center gap-2 text-xs font-bold tracking-wider"><button onClick={() => setMode("live")} className={`rounded-md px-2.5 py-1.5 ${statusBadge === "LIVE" ? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-300" : "bg-slate-800 text-slate-500"}`}>LIVE</button><span className="text-slate-600">/</span><button onClick={() => setMode("historical")} className={`rounded-md px-2.5 py-1.5 ${statusBadge === "HISTORICAL" ? "border border-cyan-300/30 bg-cyan-300/10 text-cyan-300" : "bg-slate-800 text-slate-500"}`}>HISTORICAL</button>{statusBadge === "MARKET CLOSED" && <span className="rounded-md border border-yellow-300/30 bg-yellow-300/10 px-2.5 py-1.5 text-yellow-200">MARKET CLOSED</span>}<span className="ml-2 text-[10px] font-medium uppercase tracking-widest text-slate-500">{market?.mode === "historical" ? "recorded data" : "market data"}</span></div><div className="flex items-center gap-2 text-xs text-slate-400"><span>Speed</span>{(["1x", "10x", "60x"] as Speed[]).map((option) => <button key={option} onClick={() => setSpeed(option)} className={`rounded-md px-2.5 py-1.5 font-bold ${speed === option ? "bg-cyan-300 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{option}</button>)}<span className="ml-2 hidden items-center gap-2 border-l border-slate-700 pl-3 sm:flex"><Icon name="clock" size={14} /> 14 Nov 2024 · 14:35 UTC</span></div></div>

        <section className="py-8 sm:py-10"><div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Workspace 01 / Market intelligence</p><h1 className="text-3xl font-bold tracking-[-0.05em] text-white sm:text-5xl">What are you researching?</h1><p className="mt-3 max-w-2xl text-base text-slate-400">Ask a question. Five specialized agents turn the evidence into an explainable research signal.</p></div><div className="flex items-center gap-2 self-start rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> HISTORICAL REPLAY</div></div><div className="rounded-2xl border border-slate-700 bg-[#0c1820] p-2 shadow-2xl shadow-black/20"><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex flex-1 items-center gap-3 px-4"><Icon name="search" size={22} /><input aria-label="Research question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="e.g. Should I hold SNDK?" className="w-full bg-transparent py-4 text-base text-white outline-none placeholder:text-slate-500" /></div><button disabled={isResearching} onClick={handleResearch} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{isResearching ? "ANALYZING…" : "RUN RESEARCH"} <Icon name="arrow" size={17} /></button></div></div>{!detectedTicker && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-yellow-200"><span>Try a ticker like NVDA, AAPL, TSLA or SNDK</span>{TICKERS.map((ticker) => <button key={ticker} onClick={() => setQuestion(`Should I research ${ticker}?`)} className="rounded-md border border-yellow-300/20 bg-yellow-300/10 px-2.5 py-1 text-xs font-bold text-yellow-200 transition hover:bg-yellow-300/20">{ticker}</button>)}</div>}</section>

        {errorMessage && <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">{errorMessage}</div>}
        <section className={`mb-6 rounded-3xl border ${signalVisible ? "border-cyan-300/30 bg-gradient-to-br from-[#112934] via-[#0d2029] to-[#0b161d]" : "border-dashed border-slate-700 bg-[#0c1820]"} p-6 shadow-[0_0_70px_rgba(34,211,238,0.08)] sm:p-9`} style={signalVisible ? { animation: "signal-in 500ms ease-out" } : undefined}><div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><div className="mb-4 flex items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Research signal · {displayedTicker ?? "—"}</span>{signalVisible && research && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-300">{research.evidenceSufficient ? "EVIDENCE SUFFICIENT" : "EVIDENCE INSUFFICIENT"}</span>}</div>{signalVisible && research ? <div className="flex items-end gap-5"><p className="text-6xl font-black uppercase tracking-[-0.07em] text-emerald-300 sm:text-8xl">{research.action}</p><div className="pb-2"><p className="text-sm font-semibold text-slate-200">{research.symbol} · research signal</p><p className="mt-1 text-xs text-slate-400">Not a trade instruction · Historical replay</p></div></div> : <div><p className="text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">Ask a question to generate a signal.</p><p className="mt-3 text-sm text-slate-400">{isResearching ? "Agents are reviewing the evidence. Lead will publish the signal last." : "Your signal will appear after the agents review the evidence."}</p></div>}</div>{signalVisible && research && <div className="flex items-end gap-3"><div className="text-right"><p className="text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl">{animatedConfidence}<span className="text-3xl text-cyan-300">%</span></p><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">confidence</p></div><div className="mb-1 h-14 w-px bg-slate-700" /><div className="pb-1"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">As of</p><p className="mt-1 text-sm font-semibold text-white">{research.timestamp}</p></div></div>}</div>{signalVisible && research && <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-[1fr_1fr_0.8fr]"><div><div className="mb-2 flex justify-between text-xs font-bold"><span className="text-slate-300">Confidence strength</span><span className="text-cyan-300">{animatedConfidence} / 100</span></div><div className="h-3 rounded-full bg-slate-700/70"><div className="h-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.45)] transition-[width] duration-100" style={{ width: `${animatedConfidence}%` }} /></div></div><div><div className="mb-2 flex justify-between text-xs font-bold"><span className="text-slate-300">Risk indicator</span><span className="uppercase text-yellow-300">{research.risk}</span></div><div className="flex gap-1.5"><span className="h-3 flex-1 rounded-full bg-emerald-400" /><span className={`h-3 flex-1 rounded-full ${research.risk === "low" ? "bg-emerald-400" : "bg-yellow-300"}`} /><span className={`h-3 flex-1 rounded-full ${research.risk === "high" ? "bg-red-400" : research.risk === "moderate" ? "bg-yellow-300" : "bg-slate-700"}`} /><span className="h-3 flex-1 rounded-full bg-slate-700" /><span className="h-3 flex-1 rounded-full bg-slate-700" /></div></div><div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary risk</p><p className="mt-1 text-sm font-semibold text-slate-200">{research.primaryRisk}</p></div></div>}</section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]"><div className="rounded-2xl border border-slate-700 bg-[#0c1820] p-5 sm:p-6"><div className="mb-5 flex items-end justify-between"><div><h2 className="text-lg font-bold text-white">Research team</h2><p className="mt-1 text-xs text-slate-400">Five agents · one decision</p></div><span className={`flex items-center gap-2 text-xs font-bold ${isResearching ? "text-cyan-300" : "text-slate-500"}`}><span className={`h-2 w-2 rounded-full ${isResearching ? "animate-pulse bg-cyan-300" : "bg-slate-600"}`} /> {isResearching ? "WORKING" : research ? "READY" : "IDLE"}</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-2">{agents.map((agent, index) => { const status = statuses[index]; return <div key={agent.name} className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-black text-cyan-300">{agent.initials}</div>{status === "done" ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Icon name="check" size={14} /></span> : <span className={`h-3 w-3 rounded-full ${status === "working" ? "animate-pulse bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" : "bg-slate-600"}`} />}</div><p className="mt-3 text-sm font-bold text-white">{agent.name}</p><p className="mt-1 text-[11px] text-slate-500">{agent.role}</p><p className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${status === "done" ? "text-emerald-300" : status === "working" ? "text-cyan-300" : "text-slate-500"}`}>{status}</p></div>; })}</div></div><div className="rounded-2xl border border-slate-700 bg-[#0c1820] p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-white">Live findings</h2><p className="mt-1 text-xs text-slate-400">Findings arrive as each agent finishes</p></div><div className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-200"><Icon name="bolt" size={15} /> {findings.length ? `${findings.length} agents decided in ${latencyTotal} ms` : "—"}</div></div><div className="space-y-2">{!findings.length ? <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">No findings yet. Run research to start the team.</div> : findings.map((finding) => { const tone = stanceStyle(finding.stance); return <div key={`${finding.source}-${finding.claim}`} className="grid gap-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 sm:grid-cols-[1fr_auto] sm:items-center" style={{ animation: "finding-in 450ms ease-out" }}><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md border px-2 py-1 text-[10px] font-black tracking-wider ${tone.className}`}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />{tone.label}</span><span className="text-xs text-slate-500">{finding.source}</span></div><p className="mt-2 text-sm font-semibold leading-5 text-slate-200 sm:text-base">{finding.claim}</p></div><div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 sm:justify-end"><Icon name="clock" size={14} /> {finding.latency}</div></div>; })}</div></div></section>

        {!market && <section className="mb-6 rounded-2xl border border-dashed border-slate-700 bg-[#0c1820] p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-cyan-300"><Icon name="clock" size={19} /></div><div><h2 className="text-lg font-bold text-white">Historical replay</h2><p className="mt-1 text-sm text-slate-400">Run research to load Thursday context, Friday price bars, and timestamped news.</p></div></div></section>}

        {research && market && <section className="mb-6 rounded-2xl border border-slate-700 bg-[#0c1820] p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-3"><h2 className="text-lg font-bold text-white">Historical replay</h2><span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{research.symbol} / price</span></div><p className="mt-1 text-xs text-slate-400">Thursday is faded context; Friday replays at the selected speed.</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex items-center rounded-lg bg-slate-800 p-1">{(["1x", "10x", "60x"] as Speed[]).map((option) => <button key={option} onClick={() => setSpeed(option)} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${speed === option ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"}`}>{option}</button>)}</div><button aria-label={isPlaying ? "Pause replay" : "Play replay"} onClick={() => setIsPlaying((playing) => !playing)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-slate-950"><Icon name={isPlaying ? "pause" : "play"} size={16} /></button><span className="text-sm font-bold text-white">${currentPrice.toFixed(2)}</span></div></div><div className="overflow-hidden rounded-xl border border-slate-800 bg-[#08131a] p-3"><svg className="h-44 w-full" viewBox="0 0 640 175" preserveAspectRatio="none" role="img" aria-label={`${research.symbol} price chart`}><defs><linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#67e8f9" stopOpacity="0.25" /><stop offset="100%" stopColor="#67e8f9" stopOpacity="0" /></linearGradient></defs><path d={`${replayPath} L 640 175 L 0 175 Z`} fill="url(#price-fill)" /><path d={contextPath} fill="none" stroke="#64748b" strokeOpacity="0.45" strokeWidth="3" vectorEffect="non-scaling-stroke" /><path d={replayPath} fill="none" stroke="#67e8f9" strokeWidth="3" vectorEffect="non-scaling-stroke" />{documentPoint && <circle cx={documentPoint.x} cy={documentPoint.y} r="7" fill="#facc15" stroke="#071016" strokeWidth="3" vectorEffect="non-scaling-stroke" />}<circle cx={chartPoints[chartPoints.length - 1]?.x} cy={chartPoints[chartPoints.length - 1]?.y} r="5" fill="#67e8f9" stroke="#071016" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg><div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500"><span>THU context</span>{documentPoint ? <span className="flex items-center gap-1.5 text-yellow-300"><span className="h-2 w-2 rounded-full bg-yellow-300" /> document dropped</span> : <span /> }<span>FRI replay · 14:35 UTC</span></div></div><div className="mt-4 flex items-center gap-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Replay</span><input aria-label="Replay progress" type="range" min="0" max={market.bars.length - 1} value={replayIndex} onChange={(event) => { setReplayIndex(Number(event.target.value)); setIsPlaying(false); }} className="h-2 flex-1 accent-cyan-300" /><span className="w-12 text-right font-mono text-xs text-slate-400">{replayIndex + 1}/{market.bars.length}</span></div><div className="mt-5 border-t border-slate-800 pt-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-white">News at replay timestamps</h3><span className="text-[10px] uppercase tracking-wider text-slate-500">{market.news.length} articles</span></div>{market.news.length ? <div className="grid gap-2 sm:grid-cols-2">{market.news.slice(0, 6).map((article) => <div key={article.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"><p className="text-[10px] font-bold text-cyan-300">{new Date(article.timestamp).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} ET · {article.source}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-200">{article.headline}</p></div>)}</div> : <p className="text-xs text-slate-500">No recorded news headlines for this session.</p>}</div></section>}

        <section className="grid gap-6 pb-8 lg:grid-cols-[1fr_0.55fr]"><div className={`rounded-2xl border border-dashed p-6 text-center transition sm:p-8 ${isDragging ? "border-cyan-300 bg-cyan-300/10" : "border-slate-600 bg-[#0c1820]"}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-cyan-300"><Icon name="upload" size={22} /></div><p className="mt-4 text-base font-bold text-white">Add a filing or report</p><p className="mt-1 text-sm text-slate-400">Drop a PDF to add it to the evidence set</p>{uploadStatus === "uploading" ? <p className="mt-4 text-sm font-bold text-cyan-300">Uploading…</p> : uploadStatus === "parsed" ? <p className="mt-4 text-sm font-bold text-emerald-300">parsed: {fileName}</p> : <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-cyan-300">Browse PDF <Icon name="arrow" size={15} /><input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} /></label>}{pendingDocument && !detectedTicker && <div className="mt-4 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3"><p className="text-xs font-bold text-yellow-200">Choose a ticker to analyze this filing</p><div className="mt-2 flex justify-center gap-2">{TICKERS.map((ticker) => <button key={ticker} onClick={() => analyzeWithTicker(ticker)} className="rounded-md bg-yellow-300 px-2.5 py-1 text-[11px] font-black text-slate-950">{ticker}</button>)}</div></div>}{documentText && <p className="mx-auto mt-4 max-w-xl rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-left text-xs leading-5 text-slate-300"><span className="font-bold text-cyan-300">Parsed text · first 300 characters</span><br />{documentText.slice(0, 300)}</p>}</div><div className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-[#0c1820] p-6"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><Icon name="spark" size={20} /></div><div><p className="text-sm font-bold text-white">Mock historical workspace</p><p className="mt-1 text-xs leading-5 text-slate-400">Research signals are deterministic, explainable, and clearly labeled as mock data.</p></div></div></section>
        <footer className="flex flex-col justify-between gap-2 border-t border-slate-800 py-5 text-xs text-slate-500 sm:flex-row"><span>Research and educational use only · No brokerage execution</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Mock data only</span></footer>
      </div>
    </main>
  );
}
