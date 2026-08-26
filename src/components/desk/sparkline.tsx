import type { HistoryPoint } from "@/lib/market/types";

export function Sparkline({
  points,
  className,
}: {
  points: HistoryPoint[];
  className?: string;
}) {
  if (points.length < 2) return null;
  const w = 160;
  const h = 36;
  const values = points.map((p) => p.c);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const up = values[values.length - 1]! >= values[0]!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={up ? "var(--color-gain)" : "var(--color-loss)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
