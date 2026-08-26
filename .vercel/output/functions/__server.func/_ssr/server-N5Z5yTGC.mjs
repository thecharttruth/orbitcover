import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { f as nextFridays, h as yearsFromDte, i as dteFromExpiry, l as impliedVolCall, n as blackScholesCall, o as formatDateET, p as parseNasdaqMonthDay, r as callDelta } from "./time-BTa-rzwC.mjs";
import { n as expectedMoveFromChain, r as rankItmCovers, t as decorateContract } from "./recommend-CrquKZtD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-N5Z5yTGC.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var UNDERLIER = "SPCX";
var UA = "Mozilla/5.0 (compatible; OrbitCover/1.0)";
var cache = /* @__PURE__ */ new Map();
function cached(key, ttlMs, fn) {
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value);
	return fn().then((value) => {
		cache.set(key, {
			at: Date.now(),
			value
		});
		return value;
	});
}
async function fetchJson(url, headers = {}) {
	const res = await fetch(url, {
		headers: {
			"User-Agent": UA,
			Accept: "application/json",
			...headers
		},
		signal: AbortSignal.timeout(8e3)
	});
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	return await res.json();
}
async function fetchQuoteAndHistory() {
	const [sessionRes, dailyRes] = await Promise.allSettled([fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${UNDERLIER}?interval=1m&range=1d&includePrePost=true`), fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${UNDERLIER}?interval=1d&range=3mo`)]);
	const session = sessionRes.status === "fulfilled" ? sessionRes.value : null;
	const daily = dailyRes.status === "fulfilled" ? dailyRes.value : null;
	const sess = session?.chart.result?.[0];
	const day = daily?.chart.result?.[0];
	if (!sess && !day) throw new Error("No chart result");
	const meta = sess?.meta ?? day.meta;
	const history = [];
	const dayStamps = day?.timestamp ?? [];
	const dayCloses = day?.indicators.quote[0]?.close ?? [];
	for (let i = 0; i < dayStamps.length; i++) {
		const c = dayCloses[i];
		if (c != null && Number.isFinite(c)) history.push({
			t: dayStamps[i] * 1e3,
			c
		});
	}
	const last = meta.regularMarketPrice;
	const previousClose = sess?.meta.previousClose ?? history.at(-2)?.c ?? meta.chartPreviousClose;
	const nowSec = Math.floor(Date.now() / 1e3);
	const regular = meta.currentTradingPeriod?.regular;
	const pre = meta.currentTradingPeriod?.pre;
	const post = meta.currentTradingPeriod?.post;
	let marketState = "closed";
	if (regular && nowSec >= regular.start && nowSec < regular.end) marketState = "open";
	else if (pre?.start != null && pre.end != null && nowSec >= pre.start && nowSec < pre.end) marketState = "pre";
	else if (post?.start != null && post.end != null && nowSec >= post.start && nowSec < post.end) marketState = "post";
	let postLast = null;
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
	if (postLast != null && Math.abs(postLast - last) < .01) postLast = null;
	const asOf = (/* @__PURE__ */ new Date((meta.regularMarketTime ?? nowSec) * 1e3)).toLocaleString("en-US", {
		timeZone: "America/New_York",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
	return {
		quote: {
			symbol: UNDERLIER,
			name: meta.longName ?? "Space Exploration Technologies",
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
			postLast
		},
		history
	};
}
function num(raw) {
	if (raw == null) return null;
	const t = raw.replace(/[$,%+]/g, "").replace(/,/g, "").trim();
	if (!t || t === "--" || t === "N/A" || t === "NA") return null;
	const n = Number(t);
	return Number.isFinite(n) ? n : null;
}
function enrichChain(chain, spot) {
	const years = yearsFromDte(chain.dte);
	const calls = chain.calls.map((c) => {
		const px = c.mid ?? c.sell ?? c.last;
		const iv = px != null ? impliedVolCall(px, spot, c.strike, years) : null;
		const delta = iv != null ? callDelta(spot, c.strike, years, iv) : null;
		return {
			...c,
			iv,
			delta
		};
	});
	return {
		...chain,
		calls,
		puts: chain.puts
	};
}
function parseNasdaqRows(rows, spot, preferLast) {
	if (!rows) return [];
	const year = Number(formatDateET().slice(0, 4));
	const grouped = /* @__PURE__ */ new Map();
	let current = null;
	for (const row of rows) {
		if (row.expirygroup) {
			const iso = parseNasdaqMonthDay(row.expirygroup, year);
			current = iso;
			if (iso && !grouped.has(iso)) grouped.set(iso, {
				calls: [],
				puts: []
			});
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
			openInterest: num(row.c_Openinterest)
		};
		const putRaw = {
			strike,
			expiry: current,
			last: num(row.p_Last),
			bid: num(row.p_Bid),
			ask: num(row.p_Ask),
			volume: num(row.p_Volume),
			openInterest: num(row.p_Openinterest)
		};
		bucket.calls.push(decorateContract(callRaw, spot, preferLast));
		bucket.puts.push(decorateContract(putRaw, spot, preferLast));
	}
	const chains = [];
	for (const [expiry, { calls, puts }] of grouped) {
		calls.sort((a, b) => a.strike - b.strike);
		puts.sort((a, b) => a.strike - b.strike);
		chains.push(enrichChain({
			expiry,
			dte: dteFromExpiry(expiry),
			calls,
			puts
		}, spot));
	}
	chains.sort((a, b) => a.expiry.localeCompare(b.expiry));
	return chains;
}
async function fetchNasdaqChain(spot, preferLast, from, to) {
	const params = new URLSearchParams({ assetclass: "stocks" });
	if (from) params.set("fromdate", from);
	if (to) params.set("todate", to);
	return parseNasdaqRows((await fetchJson(`https://api.nasdaq.com/api/quote/SPCX/option-chain?${params.toString()}`, {
		Origin: "https://www.nasdaq.com",
		Referer: `https://www.nasdaq.com/market-activity/stocks/${"SPCX".toLowerCase()}/option-chain`
	})).data?.table?.rows ?? [], spot, preferLast);
}
function syntheticChain(spot, expiry, iv = .57) {
	const dte = dteFromExpiry(expiry);
	const years = yearsFromDte(dte);
	const start = Math.floor(spot - 22);
	const calls = [];
	const puts = [];
	for (let k = start; k <= Math.ceil(spot + 12); k++) {
		const theo = blackScholesCall(spot, k, years, iv);
		const spread = Math.max(.05, theo * .03);
		const bid = Math.max(.01, theo - spread / 2);
		const ask = theo + spread / 2;
		const call = decorateContract({
			strike: k,
			expiry,
			last: theo,
			bid,
			ask,
			volume: k > spot - 12 && k < spot + 4 ? 800 : 40,
			openInterest: 400
		}, spot, true);
		const putTheo = theo - (spot - k);
		const putBid = Math.max(.01, putTheo - spread / 2);
		const put = decorateContract({
			strike: k,
			expiry,
			last: Math.max(.01, putTheo),
			bid: putBid,
			ask: Math.max(putBid + .05, putTheo + spread / 2),
			volume: 100,
			openInterest: 200
		}, spot, true);
		calls.push({
			...call,
			iv,
			delta: callDelta(spot, k, years, iv)
		});
		puts.push({
			...put,
			iv
		});
	}
	return {
		expiry,
		dte,
		calls,
		puts
	};
}
async function fetchExpiryChain(spot, expiry, preferLast = true) {
	try {
		const found = (await fetchNasdaqChain(spot, preferLast, expiry, expiry)).find((c) => c.expiry === expiry);
		if (found && found.calls.length > 0) return found;
	} catch {}
	return syntheticChain(spot, expiry);
}
async function buildSnapshot() {
	return cached("snapshot-v6", 3e4, async () => {
		const { quote, history } = await fetchQuoteAndHistory();
		const spot = quote.last;
		const preferLast = quote.marketState !== "open";
		const fridays = nextFridays(formatDateET(), 2);
		let warning = null;
		let weekly = null;
		let nextWeekly = null;
		let source = "Nasdaq delayed chain · Yahoo close";
		const nextExpiryHint = fridays[1] ?? fridays[0];
		const [nearestResult, nextResult] = await Promise.allSettled([fetchNasdaqChain(spot, preferLast), nextExpiryHint ? fetchNasdaqChain(spot, preferLast, nextExpiryHint, nextExpiryHint) : Promise.resolve([])]);
		if (nearestResult.status === "fulfilled" && nearestResult.value[0]) weekly = nearestResult.value[0] ?? null;
		else {
			warning = "Nasdaq chain missed — retry refresh. Stock close is still the real delayed print.";
			source = "Yahoo close";
		}
		if (!weekly || weekly.calls.length === 0) {
			weekly = syntheticChain(spot, fridays[0] ?? formatDateET());
			warning = warning ?? "Option last prints unavailable — showing model prices until the delayed chain returns.";
			source = "Yahoo close + model chain";
		}
		const nextExpiry = fridays.find((d) => d !== weekly?.expiry) ?? fridays[1];
		if (nextResult.status === "fulfilled") nextWeekly = nextResult.value.find((c) => c.expiry === nextExpiry) ?? nextResult.value[0] ?? null;
		if (nextExpiry && (!nextWeekly || nextWeekly.calls.length === 0)) try {
			nextWeekly = await fetchExpiryChain(spot, nextExpiry, preferLast);
		} catch {
			nextWeekly = syntheticChain(spot, nextExpiry);
		}
		const expectedMove = weekly ? expectedMoveFromChain(spot, weekly) : null;
		const rankedRaw = weekly && expectedMove ? rankItmCovers(spot, weekly, expectedMove) : [];
		const pick = rankedRaw[0] ?? null;
		const nextExpectedMove = nextWeekly ? expectedMoveFromChain(spot, nextWeekly) : null;
		const nextRankedRaw = nextWeekly && nextExpectedMove ? rankItmCovers(spot, nextWeekly, nextExpectedMove) : [];
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
			warning
		};
	});
}
var getMarketSnapshot_createServerFn_handler = createServerRpc({
	id: "4f770c30bfcf4b5ebc36bebfbedefcee6cb0d6b6b396debf85ee95f3fdc893bc",
	name: "getMarketSnapshot",
	filename: "src/lib/market/server.ts"
}, (opts) => getMarketSnapshot.__executeServer(opts));
var getMarketSnapshot = createServerFn({ method: "GET" }).handler(getMarketSnapshot_createServerFn_handler, async () => {
	return buildSnapshot();
});
var getExpiryChain_createServerFn_handler = createServerRpc({
	id: "af7b8afae18a1f384c132e43faab98d0bfcdd661acd1167a6b841017125368ab",
	name: "getExpiryChain",
	filename: "src/lib/market/server.ts"
}, (opts) => getExpiryChain.__executeServer(opts));
var getExpiryChain = createServerFn({ method: "GET" }).validator((input) => {
	const d = input ?? {};
	if (!d.expiry || !/^\d{4}-\d{2}-\d{2}$/.test(d.expiry)) throw new Error("expiry required");
	return { expiry: d.expiry };
}).handler(getExpiryChain_createServerFn_handler, async ({ data }) => {
	const snap = await buildSnapshot();
	if (snap.weekly?.expiry === data.expiry) return snap.weekly;
	if (snap.nextWeekly?.expiry === data.expiry) return snap.nextWeekly;
	return fetchExpiryChain(snap.quote.last, data.expiry);
});
//#endregion
export { getExpiryChain_createServerFn_handler, getMarketSnapshot_createServerFn_handler };
