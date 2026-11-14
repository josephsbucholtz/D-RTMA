"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initial = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="text-right text-sm text-slate-400">
      <p className="font-mono text-lg text-slate-100">{now?.toLocaleTimeString() ?? "--:--:--"}</p>
      <p>{now?.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) ?? "Loading clock"}</p>
    </div>
  );
}
