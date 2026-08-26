import { formatExpiryLabel } from "@/lib/time";
import { formatMoney, formatPrice, formatSignedMoney, formatStrike, signClass } from "@/lib/format";
import { stats } from "@/lib/trades/math";
import type { MarketSnapshot } from "@/lib/market/types";
import type { Trade } from "@/lib/trades/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradeStore } from "@/lib/trades/store";

export function JournalView({ trades, snapshot }: { trades: Trade[]; snapshot: MarketSnapshot | null }) {
  const removeTrade = useTradeStore((s) => s.removeTrade);
  const s = stats(trades, snapshot);
  const closed = trades.filter((t) => t.status !== "open");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat k="Extrinsic harvested" v={formatMoney(s.harvestedExtrinsic)} />
        <Stat k="Realized P&L" v={formatSignedMoney(s.realizedPnl)} tone={s.realizedPnl} />
        <Stat k="Open basis" v={s.avgOpenBasis == null ? "—" : formatPrice(s.avgOpenBasis)} />
        <Stat k="Closed weeks" v={String(s.closedCount)} />
      </div>
      {closed.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Closed weeks land here. The score that matters is harvested extrinsic — the time value you
            sold — not whether SPCX ripped or sold off.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {closed.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    {t.status === "assigned" ? "Called away" : t.status === "expired" ? "Expired, shares kept" : "Closed"}{" "}
                    · {formatStrike(t.call.strike)}C {formatExpiryLabel(t.call.expiry)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{t.closeNote}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeTrade(t.id)}>
                  Remove
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-kicker uppercase tracking-wide text-muted-foreground">P&L</div>
                  <div className={`font-mono tabular ${signClass(t.realizedPnl ?? 0)}`}>
                    {formatSignedMoney(t.realizedPnl ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-kicker uppercase tracking-wide text-muted-foreground">Extrinsic</div>
                  <div className="font-mono tabular">{formatMoney(t.harvestedExtrinsic ?? 0)}</div>
                </div>
                <div>
                  <div className="text-kicker uppercase tracking-wide text-muted-foreground">Basis</div>
                  <div className="font-mono tabular">{formatPrice(t.currentCostBasis)}</div>
                </div>
                <div>
                  <div className="text-kicker uppercase tracking-wide text-muted-foreground">Contracts</div>
                  <div className="font-mono tabular">{t.contracts}</div>
                </div>
              </CardContent>
              <ol className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                {t.events
                  .filter((e) => e.type !== "mark")
                  .map((e) => (
                    <li key={e.id} className="py-1">
                      {e.note}
                    </li>
                  ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: number }) {
  return (
    <div className="rounded-2xl bg-card px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="text-kicker uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className={`mt-1 font-mono text-lg tabular ${tone != null ? signClass(tone) : ""}`}>{v}</div>
    </div>
  );
}
