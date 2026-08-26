import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatExpiryLong } from "@/lib/time";
import { formatMoney, formatPctPlain, formatPrice, formatStrike } from "@/lib/format";
import { extrinsicCall, intrinsicCall } from "@/lib/options-math";
import type { CoverPick } from "@/lib/market/types";
import { useTradeStore } from "@/lib/trades/store";

export function TicketDialog({
  open,
  onOpenChange,
  pick,
  spot,
  delayed = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pick: CoverPick | null;
  spot: number;
  delayed?: boolean;
}) {
  const openTrade = useTradeStore((s) => s.openTrade);
  const [contracts, setContracts] = useState(1);
  const [stockFill, setStockFill] = useState(spot);
  const [callFill, setCallFill] = useState(pick?.sell ?? 0);

  useEffect(() => {
    if (!open || !pick) return;
    setContracts(1);
    setStockFill(Number(spot.toFixed(2)));
    setCallFill(Number(pick.sell.toFixed(2)));
  }, [open, pick, spot]);

  const math = useMemo(() => {
    if (!pick) return null;
    const shares = contracts * 100;
    const intrinsic = intrinsicCall(stockFill, pick.strike);
    const extrinsic = extrinsicCall(callFill, stockFill, pick.strike);
    const debit = stockFill * shares - callFill * shares;
    const basis = stockFill - callFill;
    return {
      shares,
      intrinsic,
      extrinsic,
      debit,
      basis,
      assigned: extrinsic * shares,
      cushion: callFill / stockFill,
    };
  }, [pick, contracts, stockFill, callFill]);

  if (!pick || !math) return null;

  function confirm() {
    if (!pick || !math) return;
    openTrade({
      contracts,
      stockFill,
      callFill,
      strike: pick.strike,
      expiry: pick.expiry,
      bid: pick.bid,
      ask: pick.ask,
      last: pick.last,
    });
    toast.success("Cover captured", {
      description: `${math.shares} SPCX / ${contracts} ${formatStrike(pick.strike)}C. Extrinsic ${formatMoney(math.extrinsic * math.shares)} booked against basis.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open ITM cover</DialogTitle>
          <DialogDescription>
            Buy {math.shares} SPCX and sell {contracts} {formatStrike(pick.strike)} call expiring{" "}
            {formatExpiryLong(pick.expiry)}.{" "}
            {delayed
              ? "Fills default to the delayed last print (close). This desk does not send broker orders."
              : "Fills default to last / bid. This desk does not send broker orders."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Contracts">
            <Input
              inputMode="numeric"
              value={contracts}
              onChange={(e) => setContracts(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            />
          </Field>
          <Field label="Stock fill">
            <Input
              inputMode="decimal"
              value={stockFill}
              onChange={(e) => setStockFill(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Call credit">
            <Input
              inputMode="decimal"
              value={callFill}
              onChange={(e) => setCallFill(Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Row k="Shares" v={String(math.shares)} />
          <Row k="Net debit" v={formatMoney(math.debit)} />
          <Row k="Cost basis" v={formatPrice(math.basis)} />
          <Row k="Intrinsic sold" v={formatPrice(math.intrinsic)} />
          <Row k="Extrinsic harvested" v={formatPrice(math.extrinsic)} />
          <Row k="If assigned, locked" v={formatMoney(math.assigned)} />
          <Row k="Cushion" v={formatPctPlain(math.cushion)} />
          <Row k="Breakeven" v={formatPrice(math.basis)} />
        </dl>
        <Button className="mt-5 w-full" onClick={confirm}>
          Capture cover
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg bg-secondary/60 px-3 py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono text-sm tabular">{v}</dd>
    </div>
  );
}
