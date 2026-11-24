/** The app's calendar runs on Turkish time, whatever timezone the server uses. */
export const APP_TIME_ZONE = "Europe/Istanbul";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" of the Turkish calendar day this instant falls on. */
export function dayKey(date: Date): string {
  return dayKeyFormat.format(date);
}

/** The `count` Turkish calendar days ending today (oldest first), as day keys. */
export function lastDayKeys(count: number, now: Date = new Date()): string[] {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  // Step through calendar days in UTC, where every day is exactly 24h.
  const today = Date.UTC(y, m - 1, d);
  return Array.from({ length: count }, (_, i) =>
    new Date(today - (count - 1 - i) * 86_400_000).toISOString().slice(0, 10)
  );
}

/** Counts timestamps per Turkish calendar day. */
export function countByDay(timestamps: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ts of timestamps) {
    const key = dayKey(new Date(ts));
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
