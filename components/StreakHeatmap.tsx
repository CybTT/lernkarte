import { lastDayKeys } from "@/lib/dates";
import { fmt } from "@/lib/i18n";

const DAYS = 91; // 13 full weeks

function shade(count: number): string {
  if (count === 0) return "bg-text/[0.07]";
  if (count < 5) return "bg-red/35";
  if (count < 10) return "bg-red/60";
  if (count < 20) return "bg-red/85";
  return "bg-red";
}

/**
 * A calendar of the last 13 weeks: one column per week, Monday at the top.
 * `counts` is keyed by Turkish calendar day (see lib/dates).
 */
export function StreakHeatmap({
  counts,
  label,
  cellLabel,
}: {
  counts: Record<string, number>;
  label: string;
  /** e.g. "{date}: {n} reviews" */
  cellLabel: string;
}) {
  const days = lastDayKeys(DAYS);
  // Pad the first column so each row is one weekday (Monday first).
  const [y, m, d] = days[0].split("-").map(Number);
  const offset = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;

  return (
    <div className="overflow-x-auto">
      <div role="img" aria-label={label} className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} className="h-3.5 w-3.5" />
        ))}
        {days.map((day) => {
          const count = counts[day] ?? 0;
          return (
            <span
              key={day}
              title={fmt(cellLabel, { date: day, n: count })}
              className={`h-3.5 w-3.5 rounded-[2px] ${shade(count)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
