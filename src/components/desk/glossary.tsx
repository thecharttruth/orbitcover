import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Glossary({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How the cover works</DialogTitle>
          <DialogDescription>
            The desk is built around one idea: sell weekly in-the-money calls near the expected move, and let
            assignment or a lower basis do the work.
          </DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col gap-4 text-sm">
          <Item
            t="Extrinsic value"
            d="The part of the option price that is not already in the stock. Intrinsic is spot minus strike. Extrinsic is everything else — time. If you are assigned, intrinsic nets out against the stock sale. Extrinsic is what you keep."
          />
          <Item
            t="Expected move"
            d="What the options market is pricing for the week, usually the at-the-money straddle. The desk sells a call about one of those moves in-the-money, so you are paid to sit inside the range the market already expects."
          />
          <Item
            t="If shares are taken"
            d="The call finishes in the money, your 100 shares are sold at the strike, and you keep the premium. Realized profit collapses to the extrinsic you sold. That is a completed week, not a failure. Recycle the cash into next Friday’s cover."
          />
          <Item
            t="If the stock drops"
            d="The call expires. You keep the shares and the entire premium. Cost basis falls by that credit. Next week, sell a new ITM call against the same shares — do not automatically buy more stock."
          />
          <Item
            t="Next week"
            d="The same cover, one Friday later: that week’s ATM straddle as the expected move, the ITM call nearest one move under spot, last / bid / ask, extrinsic, and yield. Use it to recycle after assignment, to overlay shares you kept, or as the up-and-out roll target."
          />
          <Item
            t="If the stock rips — when to roll up"
            d="Do not roll on a bounce. The desk flags a roll-up when SPCX is up one full expected move from your stock fill. Default is still assignment — that harvests the extrinsic you sold. Roll up (same week, higher strike) or up-and-out (next week) only if you want to keep the shares, and only if the debit to swap strikes is no larger than the extra room you just bought."
          />
          <Item
            t="What the manager captures"
            d="Fills, the intrinsic/extrinsic split, net debit, cost basis, live remaining time value, roll-up alerts, and auto-settlement after expiry (assigned vs. expired). You still confirm rolls and early closes."
          />
          <Item
            t="What it will not do"
            d="This is not a broker. Quotes are delayed (close is fine). Paper fills default to the delayed last print after the bell. Size stays in 100-share lots."
          />
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function Item({ t, d }: { t: string; d: string }) {
  return (
    <div>
      <dt className="font-medium">{t}</dt>
      <dd className="mt-1 text-muted-foreground">{d}</dd>
    </div>
  );
}
