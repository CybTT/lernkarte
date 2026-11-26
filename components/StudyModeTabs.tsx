import Link from "next/link";
import type { StudyMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";

export const STUDY_MODES: { id: StudyMode; recommended?: boolean }[] = [
  { id: "smart", recommended: true },
  { id: "flashcard" },
  { id: "typing" },
  { id: "translate" },
];

export function StudyModeTabs({ active, t }: { active: StudyMode; t: Dictionary["study"] }) {
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1 border-b border-border" aria-label={t.modesAria}>
      {STUDY_MODES.map((mode) => (
        <Link
          key={mode.id}
          href={mode.id === "smart" ? "/study" : `/study?mode=${mode.id}`}
          className={cn(
            "-mb-px flex items-baseline gap-2 rounded-[3px] border-b-2 py-2 text-sm transition-colors",
            mode.id === active ? "border-red text-text" : "border-transparent text-muted-text hover:text-text"
          )}
          aria-current={mode.id === active ? "page" : undefined}
        >
          <span>{t.modes[mode.id]}</span>
          {mode.recommended && <span className="hand text-base text-red">{t.recommended}</span>}
        </Link>
      ))}
    </nav>
  );
}
