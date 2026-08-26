import { intrinsicCall } from "@/lib/options-math";
import type { MarketSnapshot } from "@/lib/market/types";
import { lookupCallAnywhere } from "@/lib/market/lookup";
import type { PortfolioStats, Trade } from "@/lib/trades/types";

export function multiplier(trade: Trade): number {
  return trade.contracts * 100;
}

export function premiumReceived(trade: Trade): number {
  return trade.call.fill * multiplier(trade);
}

export function stockCost(trade: Trade): number {
  return trade.stockFill * trade.shares;
}

export function netDebit(trade: Trade): number {
  return stockCost(trade) - premiumReceived(trade);
}

export interface LiveMark {
  stock: number;
  call: number | null;
  intrinsic: number;
  remainingExtrinsic: number | null;
  stockPnl: number;
  optionPnl: number;
  totalPnl: number;
  ifAssigned: number;
  ifExpiredHere: number;
  moneyness: "itm" | "atm" | "otm";
  assignmentLikely: boolean;
}

export function liveMark(trade: Trade, snapshot: MarketSnapshot): LiveMark {
  const stock = snapshot.quote.last;
  const quote = lookupCallAnywhere(snapshot, trade.call.expiry, trade.call.strike);
  const callPx = quote?.mid ?? quote?.last ?? quote?.sell ?? null;
  const intrinsic = intrinsicCall(stock, trade.call.strike);
  const remainingExtrinsic =
    callPx != null ? Math.max(0, callPx - intrinsic) : null;
  const stockPnl = (stock - trade.stockFill) * trade.shares;
  const optionPnl =
    callPx != null ? (trade.call.fill - callPx) * multiplier(trade) : 0;
  const totalPnl = stockPnl + (callPx != null ? optionPnl : premiumReceived(trade) * 0);
  const ifAssigned =
    (trade.call.strike - trade.stockFill) * trade.shares + premiumReceived(trade);
  const ifExpiredHere = (stock - trade.stockFill) * trade.shares + premiumReceived(trade);
  const diff = stock - trade.call.strike;
  const moneyness: LiveMark["moneyness"] =
    diff > 0.05 ? "itm" : diff < -0.05 ? "otm" : "atm";
  return {
    stock,
    call: callPx,
    intrinsic,
    remainingExtrinsic,
    stockPnl,
    optionPnl,
    totalPnl: callPx != null ? totalPnl : ifExpiredHere - premiumReceived(trade) + optionPnl,
    ifAssigned,
    ifExpiredHere,
    moneyness,
    assignmentLikely: moneyness === "itm" && (quote?.delta ?? 0.7) >= 0.65,
  };
}

export function assignedPnl(trade: Trade): number {
  return (trade.call.strike - trade.stockFill) * trade.shares + premiumReceived(trade);
}

export function expiredPnl(trade: Trade, stockAtExpiry: number): number {
  return (stockAtExpiry - trade.stockFill) * trade.shares + premiumReceived(trade);
}

export function closePnl(
  trade: Trade,
  stockExit: number,
  callBuyback: number,
): number {
  const stock = (stockExit - trade.stockFill) * trade.shares;
  const option = (trade.call.fill - callBuyback) * multiplier(trade);
  return stock + option;
}

export function harvestedOnAssign(trade: Trade): number {
  return trade.extrinsicAtOpen * multiplier(trade);
}

export function stats(trades: Trade[], snapshot: MarketSnapshot | null): PortfolioStats {
  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status !== "open");
  let harvested = 0;
  let realized = 0;
  for (const t of trades) {
    harvested += t.harvestedExtrinsic ?? 0;
    realized += t.realizedPnl ?? 0;
  }
  let openUnrealized = 0;
  let openRemaining = 0;
  if (snapshot) {
    for (const t of open) {
      const m = liveMark(t, snapshot);
      openUnrealized += m.totalPnl;
      openRemaining += (m.remainingExtrinsic ?? 0) * multiplier(t);
    }
  }
  const capital = open.reduce((s, t) => s + netDebit(t), 0);
  const basisSum = open.reduce((s, t) => s + t.currentCostBasis * t.shares, 0);
  const shareSum = open.reduce((s, t) => s + t.shares, 0);
  return {
    openTrades: open.length,
    openShares: shareSum,
    openContracts: open.reduce((s, t) => s + t.contracts, 0),
    capitalAtWork: capital,
    harvestedExtrinsic: harvested,
    realizedPnl: realized,
    openUnrealized,
    openRemainingExtrinsic: openRemaining,
    avgOpenBasis: shareSum ? basisSum / shareSum : null,
    closedCount: closed.length,
  };
}
