import { lastDayKeys } from "@/lib/dates";
import { fmt } from "@/lib/i18n";

const DAYS = 90;

function bucket(count: number): string {
  if (count === 0) return "bg-white/5";
  if (count < 5) return "bg-amber-500/30";
  if (count < 10) return "bg-amber-500/60";
  if (count < 20) return "bg-amber-500/85";
  return "bg-amber-400 shadow-[0_0_6px_rgba(255,204,0,0.8)]";
}

/** `counts` is keyed by Turkish calendar day (see lib/dates). */
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
  const cells = lastDayKeys(DAYS).map((key) => ({ key, count: counts[key] ?? 0 }));

  return (
    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start" aria-label={label}>
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={fmt(cellLabel, { date: cell.key, n: cell.count })}
          className={`h-3 w-3 rounded-sm transition-all hover:scale-125 ${bucket(cell.count)}`}
        />
      ))}
    </div>
  );
}
