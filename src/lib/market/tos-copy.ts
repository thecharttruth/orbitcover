import type { CoverPick } from "@/lib/market/types";
import { UNDERLIER } from "@/lib/market/types";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function yymmdd(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y.slice(2)}${m}${d}`;
}

function tosDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function strikeStr(k: number): string {
  return Number.isInteger(k) ? String(k) : k.toFixed(2);
}

/** TOS option root, e.g. .SPCX260828C132 */
export function tosOptionSymbol(
  underlying: string,
  expiry: string,
  strike: number,
  right: "C" | "P" = "C",
): string {
  return `.${underlying.toUpperCase()}${yymmdd(expiry)}${right}${strikeStr(strike)}`;
}

/** Covered stock legs for Thinkorswim paste / order entry. */
export function buildTosCoverCopy(opts: {
  underlying?: string;
  pick: CoverPick;
  stockLimit: number;
  contracts?: number;
}): string {
  const u = (opts.underlying ?? UNDERLIER).toUpperCase();
  const n = Math.max(1, Math.min(20, opts.contracts ?? 1));
  const shares = n * 100;
  const callLimit = opts.pick.sell;
  const sym = tosOptionSymbol(u, opts.pick.expiry, opts.pick.strike, "C");
  const date = tosDate(opts.pick.expiry);
  const k = strikeStr(opts.pick.strike);

  return [
    sym,
    "",
    `BUY +${shares} ${u} @ LMT ${fmt(opts.stockLimit)}`,
    `SELL -${n} ${u} 100 ${date} ${k} CALL @ LMT ${fmt(callLimit)}`,
    "",
    `# Covered stock: ${shares} ${u} / short ${n}× ${k}C ${date}`,
    `# Limits are desk delayed prints — reprice on live TOS chain before send.`,
  ].join("\n");
}

export async function copyTosCover(
  pick: CoverPick,
  stockLimit: number,
  contracts = 1,
): Promise<string> {
  const text = buildTosCoverCopy({ pick, stockLimit, contracts });
  await navigator.clipboard.writeText(text);
  return text;
}
