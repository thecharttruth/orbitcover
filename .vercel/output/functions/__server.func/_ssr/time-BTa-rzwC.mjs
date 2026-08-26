//#region node_modules/.nitro/vite/services/ssr/assets/time-BTa-rzwC.js
var SQRT_2PI = Math.sqrt(2 * Math.PI);
function normPdf(x) {
	return Math.exp(-.5 * x * x) / SQRT_2PI;
}
/** Abramowitz & Stegun 26.2.17 */
function normCdf(x) {
	if (!Number.isFinite(x)) return x > 0 ? 1 : 0;
	const sign = x < 0 ? -1 : 1;
	const z = Math.abs(x);
	const t = 1 / (1 + .2316419 * z);
	const poly = t * (.31938153 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
	const y = 1 - normPdf(z) * poly;
	return sign === 1 ? y : 1 - y;
}
function yearsFromDte(dte) {
	if (dte <= 0) return 1 / 365 / 2;
	return dte / 365;
}
function blackScholesCall(spot, strike, years, iv, rate = .042) {
	if (spot <= 0 || strike <= 0 || iv <= 0) return Math.max(spot - strike, 0);
	const sqrtT = Math.sqrt(Math.max(years, 1e-8));
	const d1 = (Math.log(spot / strike) + (rate + .5 * iv * iv) * years) / (iv * sqrtT);
	const d2 = d1 - iv * sqrtT;
	return spot * normCdf(d1) - strike * Math.exp(-rate * years) * normCdf(d2);
}
function callDelta(spot, strike, years, iv, rate = .042) {
	if (spot <= 0 || strike <= 0 || iv <= 0) return spot > strike ? 1 : 0;
	const sqrtT = Math.sqrt(Math.max(years, 1e-8));
	return normCdf((Math.log(spot / strike) + (rate + .5 * iv * iv) * years) / (iv * sqrtT));
}
function impliedVolCall(price, spot, strike, years, rate = .042) {
	const intrinsic = Math.max(spot - strike, 0);
	if (!Number.isFinite(price) || price <= intrinsic + .005) return null;
	let lo = .01;
	let hi = 3.5;
	for (let i = 0; i < 48; i++) {
		const mid = (lo + hi) / 2;
		if (blackScholesCall(spot, strike, years, mid, rate) > price) hi = mid;
		else lo = mid;
	}
	const iv = (lo + hi) / 2;
	return iv > .02 && iv < 3.4 ? iv : null;
}
function intrinsicCall(spot, strike) {
	return Math.max(spot - strike, 0);
}
function extrinsicCall(premium, spot, strike) {
	return Math.max(0, premium - intrinsicCall(spot, strike));
}
function annualize(periodReturn, dte) {
	if (dte <= 0) return periodReturn * 52;
	return periodReturn * (365 / dte);
}
function midPrice(bid, ask, last) {
	if (bid != null && ask != null && ask >= bid && bid > 0) return (bid + ask) / 2;
	if (last != null && last > 0) return last;
	if (bid != null && bid > 0) return bid;
	if (ask != null && ask > 0) return ask;
	return null;
}
/** Short-call fill: bid while the session is open, last print after the close. */
function sellFill(bid, last, ask, preferLast = false) {
	if (preferLast) {
		if (last != null && last > 0) return last;
		if (bid != null && bid > 0) return bid;
		if (ask != null && ask > 0) return ask;
		return null;
	}
	if (bid != null && bid > 0) return bid;
	if (last != null && last > 0) return last;
	if (ask != null && ask > 0) return ask;
	return null;
}
var ET = "America/New_York";
function formatDateET(date = /* @__PURE__ */ new Date()) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: ET,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(date);
}
function parseISODate(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 18, 0, 0));
}
function calendarDaysBetween(fromISO, toISO) {
	const a = parseISODate(fromISO).getTime();
	const b = parseISODate(toISO).getTime();
	return Math.round((b - a) / 864e5);
}
function dteFromExpiry(expiryISO, todayISO = formatDateET()) {
	return Math.max(0, calendarDaysBetween(todayISO, expiryISO));
}
function formatExpiryLabel(expiryISO) {
	const [y, m, d] = expiryISO.split("-").map(Number);
	const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC"
	}).format(date);
}
function formatExpiryLong(expiryISO) {
	const [y, m, d] = expiryISO.split("-").map(Number);
	const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC"
	}).format(date);
}
function nextFridays(fromISO = formatDateET(), count = 4) {
	const [y, m, d] = fromISO.split("-").map(Number);
	const cursor = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	const out = [];
	while (out.length < count) {
		if (cursor.getUTCDay() === 5) {
			const iso = cursor.toISOString().slice(0, 10);
			if (iso >= fromISO) out.push(iso);
		}
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return out;
}
function parseNasdaqMonthDay(label, yearHint) {
	const full = label.trim();
	const long = Date.parse(`${full} UTC`);
	if (Number.isFinite(long)) return new Date(long).toISOString().slice(0, 10);
	const short = Date.parse(`${full} ${yearHint} UTC`);
	if (Number.isFinite(short)) return new Date(short).toISOString().slice(0, 10);
	return null;
}
//#endregion
export { extrinsicCall as a, formatExpiryLong as c, midPrice as d, nextFridays as f, yearsFromDte as h, dteFromExpiry as i, impliedVolCall as l, sellFill as m, blackScholesCall as n, formatDateET as o, parseNasdaqMonthDay as p, callDelta as r, formatExpiryLabel as s, annualize as t, intrinsicCall as u };
