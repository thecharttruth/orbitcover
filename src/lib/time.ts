const ET = "America/New_York";

export function formatDateET(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ET,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 18, 0, 0));
}

export function calendarDaysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(toISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function dteFromExpiry(expiryISO: string, todayISO = formatDateET()): number {
  return Math.max(0, calendarDaysBetween(todayISO, expiryISO));
}

export function formatExpiryLabel(expiryISO: string): string {
  const [y, m, d] = expiryISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatExpiryLong(expiryISO: string): string {
  const [y, m, d] = expiryISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function nextFridays(fromISO = formatDateET(), count = 4): string[] {
  const [y, m, d] = fromISO.split("-").map(Number);
  const cursor = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const out: string[] = [];
  while (out.length < count) {
    if (cursor.getUTCDay() === 5) {
      const iso = cursor.toISOString().slice(0, 10);
      if (iso >= fromISO) out.push(iso);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function parseNasdaqMonthDay(label: string, yearHint: number): string | null {
  const full = label.trim();
  const long = Date.parse(`${full} UTC`);
  if (Number.isFinite(long)) {
    const dt = new Date(long);
    return dt.toISOString().slice(0, 10);
  }
  const short = Date.parse(`${full} ${yearHint} UTC`);
  if (Number.isFinite(short)) {
    const dt = new Date(short);
    return dt.toISOString().slice(0, 10);
  }
  return null;
}
