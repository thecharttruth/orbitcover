import { toast } from "sonner";
import { formatCompact, formatPrice, formatPctPlain, formatStrike } from "@/lib/format";
import { formatExpiryLabel } from "@/lib/time";
import type { CoverPick } from "@/lib/market/types";
import { copyTosCover } from "@/lib/market/tos-copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ChainTable({
  picks,
  recommendedStrike,
  spot,
  onSelect,
}: {
  picks: CoverPick[];
  recommendedStrike: number | null;
  spot: number;
  onSelect: (pick: CoverPick) => void;
}) {
  const rows = [...picks]
    .filter((p) => p.strike < spot)
    .sort((a, b) => b.strike - a.strike);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No ITM weekly calls in the chain.</p>;
  }

  async function onCopyTos(row: CoverPick) {
    try {
      await copyTosCover(row, spot, 1);
      toast.success("TOS cover copied", {
        description: `${formatStrike(row.strike)}C · reprice on live TOS before send.`,
      });
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-3xl border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-kicker uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-2 text-left font-medium">Strike</th>
            <th className="px-2 py-2 text-right font-medium">Last</th>
            <th className="px-2 py-2 text-right font-medium">Bid</th>
            <th className="px-2 py-2 text-right font-medium">Ask</th>
            <th className="px-2 py-2 text-right font-medium">Intrinsic</th>
            <th className="px-2 py-2 text-right font-medium">Extrinsic</th>
            <th className="px-2 py-2 text-right font-medium">Delta</th>
            <th className="px-2 py-2 text-right font-medium">Yield</th>
            <th className="px-2 py-2 text-right font-medium">Vol / OI</th>
            <th className="px-2 py-2 text-right font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rec = recommendedStrike != null && row.strike === recommendedStrike;
            return (
              <tr
                key={`${row.expiry}-${row.strike}`}
                className={cn(
                  "border-t border-border",
                  rec && "bg-secondary/80",
                )}
              >
                <td className="px-2 py-2.5">
                  <div className="font-mono tabular">
                    {formatStrike(row.strike)}
                    <span className="text-muted-foreground">C</span>
                  </div>
                  <div className="text-kicker text-muted-foreground">
                    {formatExpiryLabel(row.expiry)}
                    {rec ? " · pick" : ""}
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular">{formatPrice(row.last)}</td>
                <td className="px-2 py-2.5 text-right font-mono tabular">{formatPrice(row.bid)}</td>
                <td className="px-2 py-2.5 text-right font-mono tabular text-muted-foreground">
                  {formatPrice(row.ask)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular text-muted-foreground">
                  {formatPrice(row.intrinsic)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular text-gain">
                  {formatPrice(row.extrinsic)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular">
                  {row.delta != null ? row.delta.toFixed(2) : "—"}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular">
                  {formatPctPlain(row.weeklyYield)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular text-muted-foreground">
                  {formatCompact(row.volume)} / {formatCompact(row.openInterest)}
                </td>
                <td className="px-2 py-2.5 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button size="sm" variant={rec ? "default" : "ghost"} onClick={() => onSelect(row)}>
                      Cover
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void onCopyTos(row)}>
                      TOS
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
