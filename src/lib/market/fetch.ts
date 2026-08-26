import {
  blackScholesCall,
  callDelta,
  impliedVolCall,
  yearsFromDte,
} from "@/lib/options-math";
import { dteFromExpiry, formatDateET, nextFridays, parseNasdaqMonthDay } from "@/lib/time";
import type {
  ContractQuote,
  ExpiryChain,
  HistoryPoint,
  MarketSnapshot,
  Quote,
} from "@/lib/market/types";
import { UNDERLIER, UNDERLIER_NAME } from "@/lib/market/types";
import { decorateContract, expectedMoveFromChain, rankItmCovers } from "@/lib/market/recommend";

const UA = "Mozilla/5.0 (compatible; OrbitCover/1.0)";

type CacheEntry<T> = { at: number; value: T };
const cache = new Map<string, CacheEntry<unknown>>();

function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value);
  return fn().then((value) => {
    cache.set(key, { at: Date.now(), value });
    return value;
  });
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

interface YahooChart {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        chartPreviousClose: number;
        previousClose?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
        regularMarketTime?: number;
        longName?: string;
        shortName?: string;
        currentTradingPeriod?: {
          pre?: { start: number; end: number };
          regular?: { start: number; end: number };
          post?: { start: number; end: number };
        };
      };
      timestamp: number[];
      indicators: { quote: Array<{ close: Array<number | null>; volume?: Array<number | null> }> };
    }>;
    error: unknown;
  };
}

async function fetchQuoteAndHistory(): Promise<{ quote: Quote; history: HistoryPoint[] }> {
  const [sessionRes, dailyRes] = await Promise.allSettled([
    fetchJson<YahooChart>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${UNDERLIER}?interval=1m&range=1d&includePrePost=true`,
    ),
    fetchJson<YahooChart>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${UNDERLIER}?interval=1d&range=3mo`,
    ),
  ]);
  const session = sessionRes.status === "fulfilled" ? sessionRes.value : null;
  const daily = dailyRes.status === "fulfilled" ? dailyRes.value : null;
  const sess = session?.chart.result?.[0];
  const day = daily?.chart.result?.[0];
  if (!sess && !day) throw new Error("No chart result");
  const meta = sess?.meta ?? day!.meta;

  const history: HistoryPoint[] = [];
  const dayStamps = day?.timestamp ?? [];
  const dayCloses = day?.indicators.quote[0]?.close ?? [];
  for (let i = 0; i < dayStamps.length; i++) {
    const c = dayCloses[i];
    if (c != null && Number.isFinite(c)) history.push({ t: dayStamps[i] * 1000, c });
  }

  const last = meta.regularMarketPrice;
  const previousClose = sess?.meta.previousClose ?? history.at(-2)?.c ?? meta.chartPreviousClose;
  const nowSec = Math.floor(Date.now() / 1000);
  const regular = meta.currentTradingPeriod?.regular;
  const pre = meta.currentTradingPeriod?.pre as { start?: number; end?: number } | undefined;
  const post = meta.currentTradingPeriod?.post as { start?: number; end?: number } | undefined;
  let marketState: Quote["marketState"] = "closed";
  if (regular && nowSec >= regular.start && nowSec < regular.end) marketState = "open";
  else if (pre?.start != null && pre.end != null && nowSec >= pre.start && nowSec < pre.end) {
    marketState = "pre";
  } else if (post?.start != null && post.end != null && nowSec >= post.start && nowSec < post.end) {
    marketState = "post";
  }

  let postLast: number | null = null;
  if (sess && post?.start != null) {
    const stamps = sess.timestamp ?? [];
    const closes = sess.indicators.quote[0]?.close ?? [];
    for (let i = stamps.length - 1; i >= 0; i--) {
      const px = closes[i];
      if (stamps[i] >= post.start && px != null && Number.isFinite(px)) {
        postLast = px;
        break;
      }
    }
  }
  if (postLast != null && Math.abs(postLast - last) < 0.01) postLast = null;

  const asOf = new Date((meta.regularMarketTime ?? nowSec) * 1000).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    quote: {
      symbol: UNDERLIER,
      name: meta.longName ?? UNDERLIER_NAME,
      last,
      previousClose,
      change: last - previousClose,
      changePct: previousClose ? (last - previousClose) / previousClose : 0,
      high: meta.regularMarketDayHigh ?? null,
      low: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      yearHigh: meta.fiftyTwoWeekHigh ?? null,
      yearLow: meta.fiftyTwoWeekLow ?? null,
      asOf,
      marketState,
      delayed: true,
      postLast,
    },
    history,
  };
}

interface NasdaqChain {
  data?: {
    lastTrade?: string;
    table?: {
      rows?: Array<{
        expirygroup?: string | null;
        expiryDate?: string | null;
        strike?: string | null;
        c_Last?: string | null;
        c_Bid?: string | null;
        c_Ask?: string | null;
        c_Volume?: string | null;
        c_Openinterest?: string | null;
        p_Last?: string | null;
        p_Bid?: string | null;
        p_Ask?: string | null;
        p_Volume?: string | null;
        p_Openinterest?: string | null;
      }>;
    };
  };
}

function num(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const t = raw.replace(/[$,%+]/g, "").replace(/,/g, "").trim();
  if (!t || t === "--" || t === "N/A" || t === "NA") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function enrichChain(chain: ExpiryChain, spot: number): ExpiryChain {
  const years = yearsFromDte(chain.dte);
  const calls = chain.calls.map((c) => {
    const px = c.mid ?? c.sell ?? c.last;
    const iv = px != null ? impliedVolCall(px, spot, c.strike, years) : null;
    const delta = iv != null ? callDelta(spot, c.strike, years, iv) : null;
    return { ...c, iv, delta };
  });
  return { ...chain, calls, puts: chain.puts };
}

function parseNasdaqRows(
  rows: NonNullable<NonNullable<NasdaqChain["data"]>["table"]>["rows"],
  spot: number,
  preferLast: boolean,
): ExpiryChain[] {
  if (!rows) return [];
  const year = Number(formatDateET().slice(0, 4));
  const grouped = new Map<string, { calls: ContractQuote[]; puts: ContractQuote[] }>();
  let current: string | null = null;

  for (const row of rows) {
    if (row.expirygroup) {
      const iso = parseNasdaqMonthDay(row.expirygroup, year);
      current = iso;
      if (iso && !grouped.has(iso)) grouped.set(iso, { calls: [], puts: [] });
      continue;
    }
    const strike = num(row.strike);
    if (strike == null || !current) continue;
    const bucket = grouped.get(current);
    if (!bucket) continue;
    const callRaw = {
      strike,
      expiry: current,
      last: num(row.c_Last),
      bid: num(row.c_Bid),
      ask: num(row.c_Ask),
      volume: num(row.c_Volume),
      openInterest: num(row.c_Openinterest),
    };
    const putRaw = {
      strike,
      expiry: current,
      last: num(row.p_Last),
      bid: num(row.p_Bid),
      ask: num(row.p_Ask),
      volume: num(row.p_Volume),
      openInterest: num(row.p_Openinterest),
    };
    bucket.calls.push(decorateContract(callRaw, spot, preferLast));
    bucket.puts.push(decorateContract(putRaw, spot, preferLast));
  }

  const chains: ExpiryChain[] = [];
  for (const [expiry, { calls, puts }] of grouped) {
    calls.sort((a, b) => a.strike - b.strike);
    puts.sort((a, b) => a.strike - b.strike);
    chains.push(enrichChain({ expiry, dte: dteFromExpiry(expiry), calls, puts }, spot));
  }
  chains.sort((a, b) => a.expiry.localeCompare(b.expiry));
  return chains;
}

async function fetchNasdaqChain(spot: number, preferLast: boolean, from?: string, to?: string): Promise<ExpiryChain[]> {
  const params = new URLSearchParams({ assetclass: "stocks" });
  if (from) params.set("fromdate", from);
  if (to) params.set("todate", to);
  const url = `https://api.nasdaq.com/api/quote/${UNDERLIER}/option-chain?${params.toString()}`;
  const json = await fetchJson<NasdaqChain>(url, {
    Origin: "https://www.nasdaq.com",
    Referer: `https://www.nasdaq.com/market-activity/stocks/${UNDERLIER.toLowerCase()}/option-chain`,
  });
  return parseNasdaqRows(json.data?.table?.rows ?? [], spot, preferLast);
}

function syntheticChain(spot: number, expiry: string, iv = 0.57): ExpiryChain {
  const dte = dteFromExpiry(expiry);
  const years = yearsFromDte(dte);
  const start = Math.floor(spot - 22);
  const calls: ContractQuote[] = [];
  const puts: ContractQuote[] = [];
  for (let k = start; k <= Math.ceil(spot + 12); k++) {
    const theo = blackScholesCall(spot, k, years, iv);
    const spread = Math.max(0.05, theo * 0.03);
    const bid = Math.max(0.01, theo - spread / 2);
    const ask = theo + spread / 2;
    const last = theo;
    const call = decorateContract(
      {
        strike: k,
        expiry,
        last,
        bid,
        ask,
        volume: k > spot - 12 && k < spot + 4 ? 800 : 40,
        openInterest: 400,
      },
      spot,
      true,
    );
    const putTheo = theo - (spot - k);
    const putBid = Math.max(0.01, putTheo - spread / 2);
    const put = decorateContract(
      {
        strike: k,
        expiry,
        last: Math.max(0.01, putTheo),
        bid: putBid,
        ask: Math.max(putBid + 0.05, putTheo + spread / 2),
        volume: 100,
        openInterest: 200,
      },
      spot,
      true,
    );
    calls.push({
      ...call,
      iv,
      delta: callDelta(spot, k, years, iv),
    });
    puts.push({ ...put, iv });
  }
  return { expiry, dte, calls, puts };
}

export async function fetchExpiryChain(spot: number, expiry: string, preferLast = true): Promise<ExpiryChain> {
  try {
    const chains = await fetchNasdaqChain(spot, preferLast, expiry, expiry);
    const found = chains.find((c) => c.expiry === expiry);
    if (found && found.calls.length > 0) return found;
  } catch {
    /* fall through */
  }
  return syntheticChain(spot, expiry);
}

export async function buildSnapshot(): Promise<MarketSnapshot> {
  return cached("snapshot-v6", 30_000, async () => {
    const { quote, history } = await fetchQuoteAndHistory();
    const spot = quote.last;
    const preferLast = quote.marketState !== "open";
    const fridays = nextFridays(formatDateET(), 2);
    let warning: string | null = null;
    let weekly: ExpiryChain | null = null;
    let nextWeekly: ExpiryChain | null = null;
    let source = "Nasdaq delayed chain · Yahoo close";

    const nextExpiryHint = fridays[1] ?? fridays[0];
    const [nearestResult, nextResult] = await Promise.allSettled([
      fetchNasdaqChain(spot, preferLast),
      nextExpiryHint ? fetchNasdaqChain(spot, preferLast, nextExpiryHint, nextExpiryHint) : Promise.resolve([]),
    ]);

    if (nearestResult.status === "fulfilled" && nearestResult.value[0]) {
      weekly = nearestResult.value[0] ?? null;
    } else {
      warning = "Nasdaq chain missed — retry refresh. Stock close is still the real delayed print.";
      source = "Yahoo close";
    }

    if (!weekly || weekly.calls.length === 0) {
      weekly = syntheticChain(spot, fridays[0] ?? formatDateET());
      warning = warning ?? "Option last prints unavailable — showing model prices until the delayed chain returns.";
      source = "Yahoo close + model chain";
    }

    const nextExpiry = fridays.find((d) => d !== weekly?.expiry) ?? fridays[1];
    if (nextResult.status === "fulfilled") {
      nextWeekly = nextResult.value.find((c) => c.expiry === nextExpiry) ?? nextResult.value[0] ?? null;
    }
    if (nextExpiry && (!nextWeekly || nextWeekly.calls.length === 0)) {
      try {
        nextWeekly = await fetchExpiryChain(spot, nextExpiry, preferLast);
      } catch {
        nextWeekly = syntheticChain(spot, nextExpiry);
      }
    }

    const expectedMove = weekly ? expectedMoveFromChain(spot, weekly) : null;
    const rankedRaw = weekly && expectedMove ? rankItmCovers(spot, weekly, expectedMove) : [];
    const pick = rankedRaw[0] ?? null;
    const nextExpectedMove = nextWeekly ? expectedMoveFromChain(spot, nextWeekly) : null;
    const nextRankedRaw =
      nextWeekly && nextExpectedMove ? rankItmCovers(spot, nextWeekly, nextExpectedMove) : [];
    const nextPick = nextRankedRaw[0] ?? null;

    return {
      quote,
      history,
      weekly,
      nextWeekly,
      expectedMove,
      nextExpectedMove,
      pick,
      nextPick,
      ranked: rankedRaw.filter((p) => p.strike < spot).slice(0, 18),
      nextRanked: nextRankedRaw.filter((p) => p.strike < spot).slice(0, 18),
      fetchedAt: Date.now(),
      source,
      warning,
    };
  });
}
