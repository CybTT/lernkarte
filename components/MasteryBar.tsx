import { cn } from "@/lib/utils";

export function MasteryBar({ mastery, className }: { mastery: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, mastery));
  return (
    <div
      className={cn("h-1.5 w-full rounded-full bg-secondary overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
