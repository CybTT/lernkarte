import { dayKey } from "./dates";
import { ERROR_TYPES, type ErrorType } from "./sentenceCheck";
import type { Verdict } from "./sentenceTasks";

export interface AttemptRow {
  created_at: string;
  verdict: Verdict;
  error_types: string[];
}

export interface WeekStats {
  /** Monday of the week (Turkish calendar), "YYYY-MM-DD". */
  weekStart: string;
  sentences: number;
  correctRate: number | null;
  errorsPerSentence: number | null;
}

export interface SentenceStats {
  sentences: number;
  correctRate: number | null;
  errorsPerSentence: number | null;
  /** Error types that occurred, most frequent first. */
  byType: { type: ErrorType; count: number }[];
  /** The last `weeks` weeks, oldest first, including empty ones. */
  weeks: WeekStats[];
}

/** Monday of the week a "YYYY-MM-DD" day belongs to. */
export function weekStartOf(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(date.getTime() - sinceMonday * 86_400_000).toISOString().slice(0, 10);
}

function summarize(rows: AttemptRow[]) {
  const sentences = rows.length;
  if (sentences === 0) return { sentences, correctRate: null, errorsPerSentence: null };
  const correct = rows.filter((r) => r.verdict === "correct").length;
  const errors = rows.reduce((n, r) => n + r.error_types.length, 0);
  return { sentences, correctRate: correct / sentences, errorsPerSentence: errors / sentences };
}

/** Totals, most common error types, and a week-by-week trend. */
export function computeSentenceStats(rows: AttemptRow[], now: Date = new Date(), weeks = 8): SentenceStats {
  const counts = new Map<ErrorType, number>();
  for (const row of rows) {
    for (const type of row.error_types) {
      if ((ERROR_TYPES as readonly string[]).includes(type)) {
        counts.set(type as ErrorType, (counts.get(type as ErrorType) ?? 0) + 1);
      }
    }
  }
  const byType = [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || ERROR_TYPES.indexOf(a.type) - ERROR_TYPES.indexOf(b.type));

  const thisWeek = weekStartOf(dayKey(now));
  const [y, m, d] = thisWeek.split("-").map(Number);
  const thisWeekMs = Date.UTC(y, m - 1, d);
  const weekKeys = Array.from({ length: weeks }, (_, i) =>
    new Date(thisWeekMs - (weeks - 1 - i) * 7 * 86_400_000).toISOString().slice(0, 10)
  );
  const byWeek = new Map<string, AttemptRow[]>(weekKeys.map((k) => [k, []]));
  for (const row of rows) {
    byWeek.get(weekStartOf(dayKey(new Date(row.created_at))))?.push(row);
  }

  return {
    ...summarize(rows),
    byType,
    weeks: weekKeys.map((weekStart) => ({ weekStart, ...summarize(byWeek.get(weekStart)!) })),
  };
}
