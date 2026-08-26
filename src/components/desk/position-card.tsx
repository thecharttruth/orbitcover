import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatExpiryLabel, formatExpiryLong } from "@/lib/time";
import { formatMoney, formatPrice, formatSignedMoney, formatStrike, signClass } from "@/lib/format";
import { liveMark, premiumReceived } from "@/lib/trades/math";
import type { CoverPick, MarketSnapshot } from "@/lib/market/types";
import type { Trade } from "@/lib/trades/types";
import { useTradeStore } from "@/lib/trades/store";
import { lookupCall } from "@/lib/market/lookup";
import { evaluateRollUp, type RollCandidate, type RollKind } from "@/lib/trades/roll";

export function PositionCard({ trade, snapshot }: { trade: Trade; snapshot: MarketSnapshot }) {
  const mark = liveMark(trade, snapshot);
  const plan = evaluateRollUp(trade, snapshot);
  const markAssigned = useTradeStore((s) => s.markAssigned);
  const markExpired = useTradeStore((s) => s.markExpired);
  const closeTrade = useTradeStore((s) => s.closeTrade);
  const rollTrade = useTradeStore((s) => s.rollTrade);
  const [closeOpen, setCloseOpen] = useState(false);
  const [rollOpen, setRollOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>
            {trade.shares} SPCX / {trade.contracts}× {formatStrike(trade.call.strike)}C{" "}
            {formatExpiryLabel(trade.call.expiry)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Basis {formatPrice(trade.currentCostBasis)} · premium {formatMoney(premiumReceived(trade))}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-1 text-kicker uppercase tracking-wide text-muted-foreground">
          {mark.moneyness}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric k="Mark P&L" v={formatSignedMoney(mark.totalPnl)} tone={mark.totalPnl} />
          <Metric
            k="Remaining ext."
            v={mark.remainingExtrinsic == null ? "—" : formatPrice(mark.remainingExtrinsic)}
          />
          <Metric k="If assigned" v={formatSignedMoney(mark.ifAssigned)} tone={mark.ifAssigned} />
          {mark.moneyness === "otm" ? (
            <Metric k="If expires here" v={formatSignedMoney(mark.ifExpiredHere)} tone={mark.ifExpiredHere} />
          ) : (
            <Metric k="Call mark" v={mark.call == null ? "—" : formatPrice(mark.call)} />
          )}
        </div>
        <div className="rounded-xl bg-secondary/70 px-3 py-2 text-sm">
          <div className="text-kicker uppercase tracking-wide text-muted-foreground">
            {plan.status === "alert" ? "Roll-up alert" : plan.status === "watch" ? "Roll-up watch" : "Roll-up trigger"}
          </div>
          <p className="mt-1 text-muted-foreground">
            Alert at {formatPrice(plan.alertAt)} — one expected move above your {formatPrice(trade.stockFill)} fill.
            Rally {formatPrice(plan.rally)} of {formatPrice(plan.expectedMove)}. Default is assignment; roll up only
            to keep the shares.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => markAssigned(trade.id)}>
            Called away
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markExpired(trade.id, snapshot.quote.last)}
          >
            Expired, keep shares
          </Button>
          <Button size="sm" variant={plan.status === "alert" ? "default" : "outline"} onClick={() => setRollOpen(true)}>
            Roll up
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCloseOpen(true)}>
            Close both
          </Button>
        </div>
      </CardContent>
      <CloseDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        trade={trade}
        snapshot={snapshot}
        onConfirm={(s, c) => {
          closeTrade(trade.id, s, c);
          toast.success("Position closed");
        }}
      />
      <RollDialog
        open={rollOpen}
        onOpenChange={setRollOpen}
        trade={trade}
        snapshot={snapshot}
        onConfirm={(next, buyback, kind) => {
          rollTrade(trade.id, next, buyback);
          toast.success(kind === "up" ? "Rolled up this week" : "Rolled up and out");
        }}
      />
    </Card>
  );
}

function Metric({ k, v, tone }: { k: string; v: string; tone?: number }) {
  return (
    <div className="rounded-xl bg-secondary/70 px-3 py-2">
      <div className="text-kicker uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className={`font-mono text-sm tabular ${tone != null ? signClass(tone) : ""}`}>{v}</div>
    </div>
  );
}

function CloseDialog({
  open,
  onOpenChange,
  trade,
  snapshot,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trade: Trade;
  snapshot: MarketSnapshot;
  onConfirm: (stock: number, call: number) => void;
}) {
  const mark = liveMark(trade, snapshot);
  const [stock, setStock] = useState(snapshot.quote.last);
  const [call, setCall] = useState(mark.call ?? trade.call.fill);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close stock and call</DialogTitle>
          <DialogDescription>Sell the shares and buy back the short call at these fills.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Stock exit</Label>
            <Input value={stock} onChange={(e) => setStock(Number(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Call buyback</Label>
            <Input value={call} onChange={(e) => setCall(Number(e.target.value) || 0)} />
          </div>
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => {
            onConfirm(stock, call);
            onOpenChange(false);
          }}
        >
          Close position
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function RollDialog({
  open,
  onOpenChange,
  trade,
  snapshot,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trade: Trade;
  snapshot: MarketSnapshot;
  onConfirm: (
    next: {
      contracts: number;
      stockFill: number;
      callFill: number;
      strike: number;
      expiry: string;
      bid: number | null;
      ask: number | null;
      last: number | null;
    },
    buyback: number,
    kind: RollKind,
  ) => void;
}) {
  const plan = useMemo(() => evaluateRollUp(trade, snapshot), [trade, snapshot]);
  const [kind, setKind] = useState<RollKind>(plan.recommended?.kind ?? "up-out");
  const candidate: RollCandidate | null = kind === "up" ? plan.sameWeek : plan.nextWeek;
  const [buyback, setBuyback] = useState(plan.buyback);
  const [strike, setStrike] = useState(candidate?.strike ?? trade.call.strike);
  const [credit, setCredit] = useState(candidate?.sell ?? 0);

  useEffect(() => {
    if (!open) return;
    const nextKind = plan.recommended?.kind ?? (plan.sameWeek ? "up" : "up-out");
    const next = nextKind === "up" ? plan.sameWeek : plan.nextWeek;
    setKind(nextKind);
    setBuyback(plan.buyback);
    setStrike(next?.strike ?? trade.call.strike);
    setCredit(next?.sell ?? 0);
  }, [open, plan, trade.call.strike]);

  const quote =
    kind === "up"
      ? lookupCall(snapshot.weekly, strike)
      : lookupCall(snapshot.nextWeekly, strike);
  const pick: CoverPick | null = candidate?.pick ?? null;
  const net = credit - buyback;
  const extraRoom = strike - trade.call.strike;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Roll the short call</DialogTitle>
          <DialogDescription>
            Buy back {formatStrike(trade.call.strike)}C and sell a higher ITM strike. Assignment is still the
            default win — roll only to keep the shares. Debit should not exceed the extra strike room.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={kind === "up" ? "default" : "outline"}
            disabled={!plan.sameWeek}
            onClick={() => {
              setKind("up");
              if (plan.sameWeek) {
                setStrike(plan.sameWeek.strike);
                setCredit(plan.sameWeek.sell);
              }
            }}
          >
            Up this week
          </Button>
          <Button
            size="sm"
            variant={kind === "up-out" ? "default" : "outline"}
            disabled={!plan.nextWeek}
            onClick={() => {
              setKind("up-out");
              if (plan.nextWeek) {
                setStrike(plan.nextWeek.strike);
                setCredit(plan.nextWeek.sell);
              }
            }}
          >
            Up & out next week
          </Button>
        </div>
        {pick ? (
          <div className="rounded-xl bg-secondary/70 px-3 py-3">
            <p className="font-mono text-base tabular">
              {formatStrike(pick.strike)}C · {formatExpiryLong(pick.expiry)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{pick.why}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Mini k="Last" v={formatPrice(pick.last)} />
              <Mini k="Bid" v={formatPrice(pick.bid)} />
              <Mini k="Ask" v={formatPrice(pick.ask)} />
              <Mini k="Extrinsic" v={formatPrice(pick.extrinsic)} />
            </dl>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No higher ITM strike scored for {kind === "up" ? "this week" : "next week"} yet.
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Buyback</Label>
            <Input value={buyback} onChange={(e) => setBuyback(Number(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>New strike</Label>
            <Input value={strike} onChange={(e) => setStrike(Number(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>New credit</Label>
            <Input value={credit} onChange={(e) => setCredit(Number(e.target.value) || 0)} />
          </div>
        </div>
        <p className="font-mono text-sm tabular">
          Net {net >= 0 ? "credit" : "debit"} {formatPrice(Math.abs(net))} · extra room {formatPrice(extraRoom)} ·
          new basis {formatPrice(trade.currentCostBasis - net)}
        </p>
        {extraRoom > 0 && -Math.min(net, 0) > extraRoom + 0.05 ? (
          <p className="text-sm text-loss">Debit is larger than the extra strike room — assignment is cleaner.</p>
        ) : null}
        <Button
          className="w-full"
          disabled={!candidate}
          onClick={() => {
            const expiry = kind === "up" ? snapshot.weekly?.expiry : snapshot.nextWeekly?.expiry;
            if (!expiry) return;
            onConfirm(
              {
                contracts: trade.contracts,
                stockFill: snapshot.quote.last,
                callFill: credit,
                strike,
                expiry,
                bid: quote?.bid ?? pick?.bid ?? null,
                ask: quote?.ask ?? pick?.ask ?? null,
                last: quote?.last ?? pick?.last ?? null,
              },
              buyback,
              kind,
            );
            onOpenChange(false);
          }}
        >
          Capture roll
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-kicker uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="font-mono tabular">{v}</dd>
    </div>
  );
}
