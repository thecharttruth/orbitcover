import {
  annualize,
  extrinsicCall,
  intrinsicCall,
  midPrice,
  sellFill,
} from "@/lib/options-math";
import type { ContractQuote, CoverPick, ExpectedMove, ExpiryChain } from "@/lib/market/types";

function nearestStrike(strikes: number[], target: number): number {
  let best = strikes[0] ?? target;
  let bestDist = Math.abs(best - target);
  for (const s of strikes) {
    const d = Math.abs(s - target);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

export function expectedMoveFromChain(
  spot: number,
  chain: ExpiryChain,
): ExpectedMove | null {
  if (chain.calls.length === 0) return null;
  const atm = nearestStrike(
    chain.calls.map((c) => c.strike),
    spot,
  );
  const call = chain.calls.find((c) => c.strike === atm);
  const put = chain.puts.find((p) => p.strike === atm);
  const callMid = call?.mid ?? call?.last ?? null;
  const putMid = put?.mid ?? put?.last ?? null;
  let dollars = 0;
  let source: ExpectedMove["source"] = "straddle";
  let iv: number | null = call?.iv ?? put?.iv ?? null;

  if (callMid != null && putMid != null) {
    dollars = callMid + putMid;
    source = "straddle";
  } else if (iv != null) {
    dollars = spot * iv * Math.sqrt(Math.max(chain.dte, 0.5) / 365);
    source = "iv";
  } else {
    return null;
  }

  return {
    dollars,
    pct: dollars / spot,
    source,
    atmStrike: atm,
    callMid,
    putMid,
    iv,
    down: spot - dollars,
    up: spot + dollars,
  };
}

function scoreCall(
  call: ContractQuote,
  spot: number,
  target: number,
  dte: number,
): CoverPick | null {
  const sell = call.sell;
  if (sell == null || sell <= 0) return null;
  if (call.strike >= spot) return null;

  const intrinsic = intrinsicCall(spot, call.strike);
  const extrinsic = extrinsicCall(sell, spot, call.strike);
  const breakeven = spot - sell;
  const cushionPct = sell / spot;
  const weeklyYield = extrinsic / Math.max(spot - sell, 1);
  const spread =
    call.bid != null && call.ask != null ? Math.max(0, call.ask - call.bid) : null;
  const dist = Math.abs(call.strike - target);
  const liq = Math.log10(1 + (call.volume ?? 0) + (call.openInterest ?? 0) / 8);
  const spreadPen = spread == null ? 0.6 : spread;
  const score =
    -dist * 14 +
    extrinsic * 1.2 -
    spreadPen * 2.4 +
    liq * 0.5 +
    (Math.abs(call.strike - target) < 0.51 ? 4 : 0);

  let why = `ITM by ${intrinsic.toFixed(2)}, ${dist.toFixed(0)} from the expected-move strike.`;
  if (dist <= 0.51) {
    why = `Pinned to one expected move in-the-money (spot − ${moveLabel(spot, target)}). Extrinsic is the week’s locked profit if shares are called away.`;
  } else if (dist <= 1.51) {
    why = `Neighbor of the expected-move strike — use this if the pinned strike is too wide.`;
  } else if (intrinsic >= 8) {
    why = `Deeper ITM — more cushion, less leftover time value.`;
  }

  return {
    expiry: call.expiry,
    dte,
    strike: call.strike,
    sell,
    mid: call.mid,
    bid: call.bid,
    ask: call.ask,
    last: call.last,
    volume: call.volume,
    openInterest: call.openInterest,
    intrinsic,
    extrinsic,
    delta: call.delta,
    iv: call.iv,
    targetStrike: target,
    distanceToTarget: dist,
    spread,
    score,
    breakeven,
    cushionPct,
    maxProfitIfAssigned: extrinsic * 100,
    weeklyYield,
    annualizedYield: annualize(weeklyYield, dte),
    why,
  };
}

function moveLabel(spot: number, target: number): string {
  return (spot - target).toFixed(2);
}

export function rankItmCovers(
  spot: number,
  chain: ExpiryChain,
  move: ExpectedMove,
): CoverPick[] {
  const itmStrikes = chain.calls.filter((c) => c.strike < spot - 0.01).map((c) => c.strike);
  const target = nearestStrike(itmStrikes, spot - move.dollars);
  const picks: CoverPick[] = [];
  for (const call of chain.calls) {
    const pick = scoreCall(call, spot, target, chain.dte);
    if (pick) picks.push(pick);
  }
  picks.sort((a, b) => {
    const aNear = Math.abs(a.strike - target);
    const bNear = Math.abs(b.strike - target);
    if (aNear !== bNear) return aNear - bNear;
    return b.score - a.score;
  });
  return picks;
}

export function decorateContract(
  raw: Omit<ContractQuote, "mid" | "sell" | "buy" | "intrinsic" | "extrinsic" | "iv" | "delta"> &
    Partial<Pick<ContractQuote, "iv" | "delta">>,
  spot: number,
  preferLast = false,
): ContractQuote {
  const mid = midPrice(raw.bid, raw.ask, raw.last);
  const sell = sellFill(raw.bid, raw.last, raw.ask, preferLast);
  const px = sell ?? mid ?? 0;
  return {
    ...raw,
    mid,
    sell,
    buy: buyFillSafe(raw.ask, raw.last, raw.bid),
    intrinsic: intrinsicCall(spot, raw.strike),
    extrinsic: px > 0 ? extrinsicCall(px, spot, raw.strike) : 0,
    iv: raw.iv ?? null,
    delta: raw.delta ?? null,
  };
}

function buyFillSafe(
  ask: number | null,
  last: number | null,
  bid: number | null,
): number | null {
  if (ask != null && ask > 0) return ask;
  if (last != null && last > 0) return last;
  if (bid != null && bid > 0) return bid;
  return null;
}
