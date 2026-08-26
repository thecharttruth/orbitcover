const SQRT_2PI = Math.sqrt(2 * Math.PI);

function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/** Abramowitz & Stegun 26.2.17 */
export function normCdf(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0;
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * z);
  const poly =
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const y = 1 - normPdf(z) * poly;
  return sign === 1 ? y : 1 - y;
}

export function yearsFromDte(dte: number): number {
  if (dte <= 0) return 1 / 365 / 2;
  return dte / 365;
}

export function blackScholesCall(
  spot: number,
  strike: number,
  years: number,
  iv: number,
  rate = 0.042,
): number {
  if (spot <= 0 || strike <= 0 || iv <= 0) return Math.max(spot - strike, 0);
  const sqrtT = Math.sqrt(Math.max(years, 1e-8));
  const d1 = (Math.log(spot / strike) + (rate + 0.5 * iv * iv) * years) / (iv * sqrtT);
  const d2 = d1 - iv * sqrtT;
  return spot * normCdf(d1) - strike * Math.exp(-rate * years) * normCdf(d2);
}

export function callDelta(
  spot: number,
  strike: number,
  years: number,
  iv: number,
  rate = 0.042,
): number {
  if (spot <= 0 || strike <= 0 || iv <= 0) return spot > strike ? 1 : 0;
  const sqrtT = Math.sqrt(Math.max(years, 1e-8));
  const d1 = (Math.log(spot / strike) + (rate + 0.5 * iv * iv) * years) / (iv * sqrtT);
  return normCdf(d1);
}

export function impliedVolCall(
  price: number,
  spot: number,
  strike: number,
  years: number,
  rate = 0.042,
): number | null {
  const intrinsic = Math.max(spot - strike, 0);
  if (!Number.isFinite(price) || price <= intrinsic + 0.005) return null;
  let lo = 0.01;
  let hi = 3.5;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const model = blackScholesCall(spot, strike, years, mid, rate);
    if (model > price) hi = mid;
    else lo = mid;
  }
  const iv = (lo + hi) / 2;
  return iv > 0.02 && iv < 3.4 ? iv : null;
}

export function intrinsicCall(spot: number, strike: number): number {
  return Math.max(spot - strike, 0);
}

export function extrinsicCall(premium: number, spot: number, strike: number): number {
  return Math.max(0, premium - intrinsicCall(spot, strike));
}

/** 1σ move. Traders usually quote the ATM straddle instead — prefer that when live. */
export function ivExpectedMove(spot: number, iv: number, dte: number): number {
  return spot * iv * Math.sqrt(yearsFromDte(dte));
}

export function annualize(periodReturn: number, dte: number): number {
  if (dte <= 0) return periodReturn * 52;
  return periodReturn * (365 / dte);
}

export function midPrice(
  bid: number | null,
  ask: number | null,
  last: number | null,
): number | null {
  if (bid != null && ask != null && ask >= bid && bid > 0) return (bid + ask) / 2;
  if (last != null && last > 0) return last;
  if (bid != null && bid > 0) return bid;
  if (ask != null && ask > 0) return ask;
  return null;
}

/** Short-call fill: bid while the session is open, last print after the close. */
export function sellFill(
  bid: number | null,
  last: number | null,
  ask: number | null,
  preferLast = false,
): number | null {
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

export function buyFill(
  ask: number | null,
  last: number | null,
  bid: number | null,
): number | null {
  if (ask != null && ask > 0) return ask;
  if (last != null && last > 0) return last;
  if (bid != null && bid > 0) return bid;
  return null;
}
