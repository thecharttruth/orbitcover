import { create } from "zustand";
import { persist } from "zustand/middleware";
import { extrinsicCall, intrinsicCall } from "@/lib/options-math";
import { formatDateET } from "@/lib/time";
import type { MarketSnapshot } from "@/lib/market/types";
import type { EventType, Trade, TradeEvent } from "@/lib/trades/types";
import { assignedPnl, closePnl, expiredPnl, harvestedOnAssign, liveMark } from "@/lib/trades/math";

interface OpenInput {
  contracts: number;
  stockFill: number;
  callFill: number;
  strike: number;
  expiry: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
}

interface TradeState {
  hydrated: boolean;
  trades: Trade[];
  setHydrated: () => void;
  openTrade: (input: OpenInput) => Trade;
  markOpen: (snapshot: MarketSnapshot) => void;
  settleExpired: (snapshot: MarketSnapshot) => void;
  markAssigned: (id: string) => void;
  markExpired: (id: string, stockAtExpiry: number) => void;
  closeTrade: (id: string, stockExit: number, callBuyback: number) => void;
  rollTrade: (id: string, next: OpenInput, buyback: number) => void;
  removeTrade: (id: string) => void;
}

function nid(): string {
  return crypto.randomUUID();
}

function event(type: EventType, note: string, payload?: TradeEvent["payload"]): TradeEvent {
  return { id: nid(), at: new Date().toISOString(), type, note, payload };
}

function makeTrade(input: OpenInput): Trade {
  const shares = input.contracts * 100;
  const intrinsic = intrinsicCall(input.stockFill, input.strike);
  const extrinsic = extrinsicCall(input.callFill, input.stockFill, input.strike);
  const basis = input.stockFill - input.callFill;
  const now = new Date().toISOString();
  const callOpenedAt = now;
  return {
    id: nid(),
    openedAt: now,
    contracts: input.contracts,
    shares,
    stockFill: input.stockFill,
    call: {
      expiry: input.expiry,
      strike: input.strike,
      fill: input.callFill,
      bidAtOpen: input.bid,
      askAtOpen: input.ask,
      lastAtOpen: input.last,
      openedAt: callOpenedAt,
    },
    intrinsicAtOpen: intrinsic,
    extrinsicAtOpen: extrinsic,
    openingCostBasis: basis,
    currentCostBasis: basis,
    status: "open",
    events: [
      event(
        "open",
        `Bought ${shares} SPCX @ ${input.stockFill.toFixed(2)} and sold ${input.contracts} ${input.strike}C ${input.expiry} @ ${input.callFill.toFixed(2)}. Extrinsic ${extrinsic.toFixed(2)} captured at open.`,
        {
          stockFill: input.stockFill,
          callFill: input.callFill,
          strike: input.strike,
          expiry: input.expiry,
          extrinsic,
          intrinsic,
          basis,
        },
      ),
    ],
  };
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      trades: [],
      setHydrated: () => set({ hydrated: true }),
      openTrade: (input) => {
        const trade = makeTrade(input);
        set({ trades: [trade, ...get().trades] });
        return trade;
      },
      markOpen: (snapshot) => {
        const today = formatDateET();
        set({
          trades: get().trades.map((t) => {
            if (t.status !== "open") return t;
            if (t.lastMarkAt === today) {
              return {
                ...t,
                lastStockMark: snapshot.quote.last,
                lastCallMark: liveMark(t, snapshot).call ?? t.lastCallMark,
              };
            }
            const m = liveMark(t, snapshot);
            return {
              ...t,
              lastMarkAt: today,
              lastStockMark: m.stock,
              lastCallMark: m.call ?? t.lastCallMark,
              events: [
                ...t.events,
                event(
                  "mark",
                  `Marked ${m.stock.toFixed(2)} / call ${m.call?.toFixed(2) ?? "—"}. Remaining extrinsic ${m.remainingExtrinsic?.toFixed(2) ?? "—"}.`,
                  {
                    stock: m.stock,
                    call: m.call,
                    remainingExtrinsic: m.remainingExtrinsic,
                    totalPnl: m.totalPnl,
                  },
                ),
              ],
            };
          }),
        });
      },
      settleExpired: (snapshot) => {
        const today = formatDateET();
        set({
          trades: get().trades.map((t) => {
            if (t.status !== "open") return t;
            if (t.call.expiry >= today) return t;
            const close = snapshot.quote.last;
            const assigned = close >= t.call.strike;
            if (assigned) {
              const pnl = assignedPnl(t);
              const harvested = harvestedOnAssign(t);
              return {
                ...t,
                status: "assigned" as const,
                closedAt: new Date().toISOString(),
                realizedPnl: pnl,
                harvestedExtrinsic: harvested,
                closeNote: "Auto-settled: close ≥ strike — shares called away.",
                events: [
                  ...t.events,
                  event(
                    "assigned",
                    `Auto-assigned. Shares sold at ${t.call.strike.toFixed(2)}. Realized ${pnl.toFixed(2)} (extrinsic harvested ${harvested.toFixed(2)}).`,
                    { pnl, harvested, close },
                  ),
                ],
              };
            }
            const pnl = expiredPnl(t, close);
            const harvested = t.call.fill * t.contracts * 100;
            return {
              ...t,
              status: "expired" as const,
              closedAt: new Date().toISOString(),
              realizedPnl: pnl,
              harvestedExtrinsic: harvested,
              currentCostBasis: t.stockFill - t.call.fill,
              closeNote: "Auto-settled: close < strike — call expired, shares kept.",
              events: [
                ...t.events,
                event(
                  "expired",
                  `Call expired. Kept ${t.shares} shares. Premium ${harvested.toFixed(2)} stays as basis reduction. Mark ${close.toFixed(2)}.`,
                  { pnl, harvested, close },
                ),
              ],
            };
          }),
        });
      },
      markAssigned: (id) => {
        set({
          trades: get().trades.map((t) => {
            if (t.id !== id || t.status !== "open") return t;
            const pnl = assignedPnl(t);
            const harvested = harvestedOnAssign(t);
            return {
              ...t,
              status: "assigned" as const,
              closedAt: new Date().toISOString(),
              realizedPnl: pnl,
              harvestedExtrinsic: harvested,
              closeNote: "Shares called away at strike.",
              events: [
                ...t.events,
                event(
                  "assigned",
                  `Called away at ${t.call.strike.toFixed(2)}. Locked the extrinsic harvested at open ($${harvested.toFixed(2)}).`,
                  { pnl, harvested },
                ),
              ],
            };
          }),
        });
      },
      markExpired: (id, stockAtExpiry) => {
        set({
          trades: get().trades.map((t) => {
            if (t.id !== id || t.status !== "open") return t;
            const pnl = expiredPnl(t, stockAtExpiry);
            const harvested = t.call.fill * t.contracts * 100;
            return {
              ...t,
              status: "expired" as const,
              closedAt: new Date().toISOString(),
              realizedPnl: pnl,
              harvestedExtrinsic: harvested,
              closeNote: "Call expired; shares kept.",
              events: [
                ...t.events,
                event(
                  "expired",
                  `Expired OTM. Kept shares. Full premium ${harvested.toFixed(2)} reduced cost basis to ${t.currentCostBasis.toFixed(2)}.`,
                  { pnl, harvested, stockAtExpiry },
                ),
              ],
            };
          }),
        });
      },
      closeTrade: (id, stockExit, callBuyback) => {
        set({
          trades: get().trades.map((t) => {
            if (t.id !== id || t.status !== "open") return t;
            const pnl = closePnl(t, stockExit, callBuyback);
            const optionHarvest = (t.call.fill - callBuyback) * t.contracts * 100;
            return {
              ...t,
              status: "closed" as const,
              closedAt: new Date().toISOString(),
              realizedPnl: pnl,
              harvestedExtrinsic: Math.max(0, optionHarvest),
              closeNote: "Closed stock and short call.",
              events: [
                ...t.events,
                event(
                  "close",
                  `Closed: sold shares @ ${stockExit.toFixed(2)}, bought back call @ ${callBuyback.toFixed(2)}. P&L ${pnl.toFixed(2)}.`,
                  { pnl, stockExit, callBuyback },
                ),
              ],
            };
          }),
        });
      },
      rollTrade: (id, next, buyback) => {
        set({
          trades: get().trades.map((t) => {
            if (t.id !== id || t.status !== "open") return t;
            const rollCredit = next.callFill - buyback;
            const newBasis = t.currentCostBasis - rollCredit;
            const intrinsic = intrinsicCall(next.stockFill, next.strike);
            const extrinsic = extrinsicCall(next.callFill, next.stockFill, next.strike);
            return {
              ...t,
              currentCostBasis: newBasis,
              call: {
                expiry: next.expiry,
                strike: next.strike,
                fill: next.callFill,
                bidAtOpen: next.bid,
                askAtOpen: next.ask,
                lastAtOpen: next.last,
                openedAt: new Date().toISOString(),
              },
              intrinsicAtOpen: intrinsic,
              extrinsicAtOpen: extrinsic,
              events: [
                ...t.events,
                event(
                  "roll",
                  `Rolled to ${next.strike}C ${next.expiry}. Bought back @ ${buyback.toFixed(2)}, sold @ ${next.callFill.toFixed(2)} (${rollCredit >= 0 ? "credit" : "debit"} ${Math.abs(rollCredit).toFixed(2)}). Basis now ${newBasis.toFixed(2)}.`,
                  {
                    buyback,
                    newFill: next.callFill,
                    newStrike: next.strike,
                    newExpiry: next.expiry,
                    rollCredit,
                    newBasis,
                  },
                ),
              ],
            };
          }),
        });
      },
      removeTrade: (id) => set({ trades: get().trades.filter((t) => t.id !== id) }),
    }),
    {
      name: "orbit-cover.trades",
      skipHydration: true,
      partialize: (s) => ({ trades: s.trades }),
    },
  ),
);
