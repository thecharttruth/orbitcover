const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const moneyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const px = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(n: number, opts?: { whole?: boolean }): string {
  if (!Number.isFinite(n)) return "—";
  return (opts?.whole ? moneyWhole : money).format(n);
}

export function formatPrice(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatSigned(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return px.format(0);
}

export function formatSignedMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const body = money.format(Math.abs(n));
  if (n > 0) return `+${body}`;
  if (n < 0) return `−${body}`;
  return money.format(0);
}

export function formatPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const pct = n * 100;
  const abs = Math.abs(pct).toFixed(digits);
  if (pct > 0) return `+${abs}%`;
  if (pct < 0) return `−${abs}%`;
  return `${Number(0).toFixed(digits)}%`;
}

export function formatPctPlain(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return compact.format(n);
}

export function formatStrike(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function signClass(n: number): "text-gain" | "text-loss" | "text-muted-foreground" {
  if (n > 0.0005) return "text-gain";
  if (n < -0.0005) return "text-loss";
  return "text-muted-foreground";
}
