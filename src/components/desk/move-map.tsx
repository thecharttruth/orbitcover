import { formatPrice, formatStrike } from "@/lib/format";
import type { CoverPick, ExpectedMove } from "@/lib/market/types";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function MoveMap({
  last,
  expectedMove,
  pick,
}: {
  last: number;
  expectedMove: ExpectedMove | null;
  pick: CoverPick | null;
}) {
  if (!expectedMove) {
    return <p className="text-sm text-muted-foreground">Expected move loads with this expiry’s chain.</p>;
  }
  const lo = Math.min(expectedMove.down - 4, pick?.breakeven ?? expectedMove.down, last - 8);
  const hi = Math.max(expectedMove.up + 4, last + 6);
  const span = hi - lo || 1;
  const pct = (px: number) => `${clamp(((px - lo) / span) * 100, 1, 99)}%`;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-20">
        <div className="absolute top-7 right-0 left-0 h-px bg-border" />
        <div
          className="absolute top-6 h-3 rounded-full bg-track"
          style={{
            left: pct(expectedMove.down),
            width: `${clamp(((expectedMove.up - expectedMove.down) / span) * 100, 4, 90)}%`,
          }}
        />
        {pick ? <Tick left={pct(pick.strike)} label={`${formatStrike(pick.strike)}C`} sub="strike" /> : null}
        {pick && Math.abs(pick.breakeven - pick.strike) / span > 0.045 ? (
          <Tick left={pct(pick.breakeven)} label={formatPrice(pick.breakeven)} sub="basis" />
        ) : null}
        <Tick left={pct(last)} label={formatPrice(last)} sub="spot" accent />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat
          k="Expected move"
          v={`±${formatPrice(expectedMove.dollars)}`}
          d={expectedMove.source === "straddle" ? "ATM straddle" : "From IV"}
        />
        <Stat k="Downside band" v={formatPrice(expectedMove.down)} d="One move below" />
        <Stat k="Upside band" v={formatPrice(expectedMove.up)} d="One move above" />
      </div>
    </div>
  );
}

function Tick({
  left,
  label,
  sub,
  accent,
}: {
  left: string;
  label: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="absolute top-0 -translate-x-1/2" style={{ left }}>
      <div className="flex flex-col items-center">
        <span className={`font-mono text-kicker tabular ${accent ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </span>
        <span className="text-kicker uppercase tracking-wide text-muted-foreground">{sub}</span>
        <div className={`mt-1 h-3 w-px ${accent ? "bg-primary" : "bg-border"}`} />
        <div className={`size-1.5 rounded-full ${accent ? "bg-primary" : "bg-muted-foreground"}`} />
      </div>
    </div>
  );
}

function Stat({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="rounded-xl bg-secondary/70 px-3 py-2">
      <div className="text-kicker uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="font-mono text-sm tabular">{v}</div>
      <div className="text-kicker text-muted-foreground">{d}</div>
    </div>
  );
}
