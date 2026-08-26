import type { ContractQuote, ExpiryChain, MarketSnapshot } from "@/lib/market/types";

export function lookupCall(chain: ExpiryChain | null | undefined, strike: number): ContractQuote | null {
  if (!chain) return null;
  return chain.calls.find((c) => Math.abs(c.strike - strike) < 0.001) ?? null;
}

export function lookupCallAnywhere(
  snapshot: MarketSnapshot,
  expiry: string,
  strike: number,
): ContractQuote | null {
  for (const chain of [snapshot.weekly, snapshot.nextWeekly]) {
    if (chain && chain.expiry === expiry) {
      const hit = lookupCall(chain, strike);
      if (hit) return hit;
    }
  }
  return null;
}
