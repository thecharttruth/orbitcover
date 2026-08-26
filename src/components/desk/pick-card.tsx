import { formatCompact, formatMoney, formatPctPlain, formatPrice, formatStrike } from "@/lib/format";
import { formatExpiryLong } from "@/lib/time";
import type { CoverPick, ExpectedMove } from "@/lib/market/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoveMap } from "@/components/desk/move-map";

export function WeekPanel({
  label,
  last,
  pick,
  expectedMove,
  onOpen,
}: {
  label: string;
  last: number;
  pick: CoverPick | null;
  expectedMove: ExpectedMove | null;
  onOpen: (pick: CoverPick) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>
          {pick
            ? `${formatExpiryLong(pick.expiry)} · ${pick.dte} DTE · sell near one expected move ITM`
            : "Waiting on this expiry’s delayed chain."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <MoveMap last={last} expectedMove={expectedMove} pick={pick} />
        {pick ? (
          <>
            <div>
              <p className="text-kicker uppercase tracking-wide text-muted-foreground">Recommended cover</p>
              <p className="mt-1 font-mono text-2xl tabular tracking-tight">
                {formatStrike(pick.strike)}C · {formatExpiryLong(pick.expiry)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{pick.why}</p>
            </div>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat k="Last" v={formatPrice(pick.last)} />
              <Stat k="Bid" v={formatPrice(pick.bid)} />
              <Stat k="Ask" v={formatPrice(pick.ask)} />
              <Stat k="Sell / credit" v={formatPrice(pick.sell)} />
              <Stat k="Extrinsic" v={formatPrice(pick.extrinsic)} gain />
              <Stat k="Intrinsic" v={formatPrice(pick.intrinsic)} />
              <Stat k="Delta" v={pick.delta != null ? pick.delta.toFixed(2) : "—"} />
              <Stat k="Weekly yield" v={formatPctPlain(pick.weeklyYield)} />
              <Stat k="Basis if filled" v={formatPrice(pick.breakeven)} />
              <Stat k="If assigned" v={formatMoney(pick.maxProfitIfAssigned)} />
              <Stat k="Volume" v={formatCompact(pick.volume)} />
              <Stat k="Open interest" v={formatCompact(pick.openInterest)} />
            </dl>
            <Button className="w-full sm:w-auto" onClick={() => onOpen(pick)}>
              Open 1× {formatStrike(pick.strike)}C
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No ITM call scored for this expiry yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ k, v, gain }: { k: string; v: string; gain?: boolean }) {
  return (
    <div className="rounded-xl bg-secondary/70 px-3 py-2">
      <div className="text-kicker uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className={`font-mono text-sm tabular ${gain ? "text-gain" : ""}`}>{v}</div>
    </div>
  );
}
