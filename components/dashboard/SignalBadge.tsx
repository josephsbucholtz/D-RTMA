type Signal = "buy" | "hold" | "sell" | string;

export function SignalBadge({ signal }: { signal: Signal }) {
  const colors = signal === "buy"
    ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
    : signal === "sell"
      ? "bg-rose-400/15 text-rose-300 ring-rose-400/30"
      : "bg-amber-400/15 text-amber-200 ring-amber-400/30";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ring-1 ${colors}`}>{signal}</span>;
}
