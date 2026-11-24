const DAYS = 90;

function bucket(count: number): string {
  if (count === 0) return "bg-white/5";
  if (count < 5) return "bg-amber-500/30";
  if (count < 10) return "bg-amber-500/60";
  if (count < 20) return "bg-amber-500/85";
  return "bg-amber-400 shadow-[0_0_6px_rgba(255,204,0,0.8)]";
}

export function StreakHeatmap({ counts }: { counts: Record<string, number> }) {
  const today = new Date();
  const cells = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, count: counts[key] ?? 0 };
  });

  return (
    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start" aria-label="Son 90 günlük çalışma geçmişi">
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={`${cell.key}: ${cell.count} tekrar`}
          className={`h-3 w-3 rounded-sm transition-all hover:scale-125 ${bucket(cell.count)}`}
        />
      ))}
    </div>
  );
}
