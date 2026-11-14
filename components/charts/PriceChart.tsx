"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Bar = { timestamp: string; close: number };

export function PriceChart({ bars }: { bars: Bar[] }) {
  const data = bars.slice(-90).map((bar) => ({
    time: new Date(bar.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    close: bar.close,
  }));

  if (!data.length) return <div className="flex h-48 items-center justify-center text-sm text-slate-500">No market bars returned.</div>;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs><linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
          <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} minTickGap={36} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin", "dataMax"]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} labelStyle={{ color: "#94a3b8" }} formatter={(value) => [`$${Number(value).toFixed(2)}`, "Close"]} />
          <Area type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={2} fill="url(#price-fill)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
