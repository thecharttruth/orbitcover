import { rankItmCovers } from "@/lib/market/recommend";
import { lookupCall } from "@/lib/market/lookup";
import type { ContractQuote, CoverPick, ExpiryChain, MarketSnapshot } from "@/lib/market/types";
import { liveMark } from "@/lib/trades/math";
import type { Trade } from "@/lib/trades/types";

export type RollKind = "up" | "up-out";
export type RollStatus = "idle" | "watch" | "alert" | "too-late";

export interface RollCandidate {
  kind: RollKind;
  expiry: string;
  strike: number;
  sell: number;
  buyback: number;
  net: number;
  extraRoom: number;
  debitCovered: boolean;
  extrinsic: number;
  quote: ContractQuote | null;
  pick: CoverPick | null;
}

export interface RollPlan {
  status: RollStatus;
  rally: number;
  expectedMove: number;
  watchAt: number;
  alertAt: number;
  progress: number;
  dte: number;
  buyback: number;
  sameWeek: RollCandidate | null;
  nextWeek: RollCandidate | null;
  recommended: RollCandidate | null;
}

function dteFor(trade: Trade, snapshot: MarketSnapshot): number {
  if (snapshot.weekly?.expiry === trade.call.expiry) return snapshot.weekly.dte;
  if (snapshot.nextWeekly?.expiry === trade.call.expiry) return snapshot.nextWeekly.dte;
  return 0;
}

function higherItmPick(spot: number, chain: ExpiryChain, move: NonNullable<MarketSnapshot["expectedMove"]>, floor: number): CoverPick | null {
  const ranked = rankItmCovers(spot, chain, move);
  const higher = ranked.filter((p) => p.strike > floor + 0.01);
  if (higher.length === 0) return null;
  higher.sort((a, b) => Math.abs(a.strike - (spot - move.dollars)) - Math.abs(b.strike - (spot - move.dollars)));
  return higher[0] ?? null;
}

function candidate(
  kind: RollKind,
  pick: CoverPick | null,
  chain: ExpiryChain | null,
  buyback: number,
  oldStrike: number,
): RollCandidate | null {
  if (!pick || !chain) return null;
  const extraRoom = pick.strike - oldStrike;
  if (extraRoom <= 0) return null;
  const net = pick.sell - buyback;
  const debit = Math.max(0, -net);
  return {
    kind,
    expiry: pick.expiry,
    strike: pick.strike,
    sell: pick.sell,
    buyback,
    net,
    extraRoom,
    debitCovered: debit <= extraRoom + 0.05,
    extrinsic: pick.extrinsic,
    quote: lookupCall(chain, pick.strike),
    pick,
  };
}

export function evaluateRollUp(trade: Trade, snapshot: MarketSnapshot): RollPlan {
  const em = snapshot.expectedMove?.dollars ?? 0;
  const spot = snapshot.quote.last;
  const rally = spot - trade.stockFill;
  const watchAt = trade.stockFill + em * 0.5;
  const alertAt = trade.stockFill + em;
  const progress = em > 0 ? rally / em : 0;
  const dte = dteFor(trade, snapshot);
  const mark = liveMark(trade, snapshot);
  const currentChain =
    snapshot.weekly?.expiry === trade.call.expiry
      ? snapshot.weekly
      : snapshot.nextWeekly?.expiry === trade.call.expiry
        ? snapshot.nextWeekly
        : snapshot.weekly;
  const laterChain =
    currentChain && snapshot.nextWeekly && snapshot.nextWeekly.expiry !== currentChain.expiry
      ? snapshot.nextWeekly
      : null;
  const current = lookupCall(currentChain, trade.call.strike);
  const buyback = current?.buy ?? current?.ask ?? current?.last ?? mark.call ?? trade.call.fill;

  const samePick =
    currentChain && snapshot.expectedMove
      ? higherItmPick(
          spot,
          currentChain,
          currentChain === snapshot.nextWeekly && snapshot.nextExpectedMove
            ? snapshot.nextExpectedMove
            : snapshot.expectedMove,
          trade.call.strike,
        )
      : null;
  const laterMove =
    laterChain === snapshot.nextWeekly ? snapshot.nextExpectedMove ?? snapshot.expectedMove : snapshot.expectedMove;
  const nextPick =
    laterChain && laterMove ? higherItmPick(spot, laterChain, laterMove, trade.call.strike) : null;

  const sameWeek = candidate("up", samePick, currentChain ?? null, buyback, trade.call.strike);
  const nextWeek = candidate("up-out", nextPick, laterChain, buyback, trade.call.strike);

  let status: RollStatus = "idle";
  if (dte <= 1) status = "too-late";
  else if (em > 0 && rally >= em) status = "alert";
  else if (em > 0 && rally >= em * 0.5) status = "watch";

  let recommended: RollCandidate | null = null;
  if (status === "alert" || status === "watch") {
    if (dte >= 2 && sameWeek?.debitCovered) recommended = sameWeek;
    else if (nextWeek?.debitCovered) recommended = nextWeek;
    else recommended = (dte >= 2 ? sameWeek : nextWeek) ?? nextWeek ?? sameWeek;
  } else if (status === "too-late") {
    recommended = nextWeek?.debitCovered ? nextWeek : nextWeek;
  }

  return {
    status,
    rally,
    expectedMove: em,
    watchAt,
    alertAt,
    progress,
    dte,
    buyback,
    sameWeek,
    nextWeek,
    recommended,
  };
}
