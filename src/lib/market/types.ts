export const UNDERLIER = "SPCX" as const;
export const UNDERLIER_NAME = "Space Exploration Technologies";

export interface HistoryPoint {
  t: number;
  c: number;
}

export interface ContractQuote {
  strike: number;
  expiry: string;
  last: number | null;
  bid: number | null;
  ask: number | null;
  volume: number | null;
  openInterest: number | null;
  mid: number | null;
  sell: number | null;
  buy: number | null;
  intrinsic: number;
  extrinsic: number;
  iv: number | null;
  delta: number | null;
}

export interface ExpiryChain {
  expiry: string;
  dte: number;
  calls: ContractQuote[];
  puts: ContractQuote[];
}

export interface Quote {
  symbol: string;
  name: string;
  last: number;
  previousClose: number;
  change: number;
  changePct: number;
  high: number | null;
  low: number | null;
  volume: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  asOf: string;
  marketState: "open" | "closed" | "pre" | "post";
  delayed: boolean;
  postLast: number | null;
}

export interface ExpectedMove {
  dollars: number;
  pct: number;
  source: "straddle" | "iv";
  atmStrike: number;
  callMid: number | null;
  putMid: number | null;
  iv: number | null;
  down: number;
  up: number;
}

export interface CoverPick {
  expiry: string;
  dte: number;
  strike: number;
  sell: number;
  mid: number | null;
  bid: number | null;
  ask: number | null;
  last: number | null;
  volume: number | null;
  openInterest: number | null;
  intrinsic: number;
  extrinsic: number;
  delta: number | null;
  iv: number | null;
  targetStrike: number;
  distanceToTarget: number;
  spread: number | null;
  score: number;
  breakeven: number;
  cushionPct: number;
  maxProfitIfAssigned: number;
  weeklyYield: number;
  annualizedYield: number;
  why: string;
}

export interface MarketSnapshot {
  quote: Quote;
  history: HistoryPoint[];
  weekly: ExpiryChain | null;
  nextWeekly: ExpiryChain | null;
  expectedMove: ExpectedMove | null;
  nextExpectedMove: ExpectedMove | null;
  pick: CoverPick | null;
  nextPick: CoverPick | null;
  ranked: CoverPick[];
  nextRanked: CoverPick[];
  fetchedAt: number;
  source: string;
  warning: string | null;
}
