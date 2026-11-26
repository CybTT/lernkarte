import { cn } from "@/lib/utils";

/** A thin line that fills with mastery (0–100). Colour follows the surface. */
export function MasteryBar({ mastery, className }: { mastery: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, mastery));
  return (
    <div
      className={cn("h-[3px] w-full overflow-hidden bg-current/15", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: "var(--mastery-fill)" }}
      />
    </div>
  );
}
