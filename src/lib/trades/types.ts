export type TradeStatus = "open" | "assigned" | "expired" | "closed";

export type EventType =
  | "open"
  | "mark"
  | "roll"
  | "assigned"
  | "expired"
  | "close"
  | "note";

export interface TradeEvent {
  id: string;
  at: string;
  type: EventType;
  note: string;
  payload?: Record<string, number | string | null>;
}

export interface ShortCall {
  expiry: string;
  strike: number;
  fill: number;
  bidAtOpen: number | null;
  askAtOpen: number | null;
  lastAtOpen: number | null;
  openedAt: string;
}

export interface Trade {
  id: string;
  openedAt: string;
  contracts: number;
  shares: number;
  stockFill: number;
  call: ShortCall;
  intrinsicAtOpen: number;
  extrinsicAtOpen: number;
  openingCostBasis: number;
  currentCostBasis: number;
  status: TradeStatus;
  events: TradeEvent[];
  lastMarkAt?: string;
  lastStockMark?: number;
  lastCallMark?: number;
  closedAt?: string;
  realizedPnl?: number;
  harvestedExtrinsic?: number;
  closeNote?: string;
}

export interface PortfolioStats {
  openTrades: number;
  openShares: number;
  openContracts: number;
  capitalAtWork: number;
  harvestedExtrinsic: number;
  realizedPnl: number;
  openUnrealized: number;
  openRemainingExtrinsic: number;
  avgOpenBasis: number | null;
  closedCount: number;
}
