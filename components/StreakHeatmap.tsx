const DAYS = 90;

function bucket(count: number): string {
  if (count === 0) return "bg-secondary";
  if (count < 5) return "bg-brand/25";
  if (count < 10) return "bg-brand/50";
  if (count < 20) return "bg-brand/75";
  return "bg-brand";
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
    <div className="flex flex-wrap gap-1" aria-label="Son 90 günlük çalışma geçmişi">
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={`${cell.key}: ${cell.count} tekrar`}
          className={`size-2.5 rounded-sm ${bucket(cell.count)}`}
        />
      ))}
    </div>
  );
}
