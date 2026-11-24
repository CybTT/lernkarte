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
    <nav className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-[#121318] p-1.5 w-fit mx-auto" aria-label={t.modesAria}>
      {STUDY_MODES.map((mode) => (
        <Link
          key={mode.id}
          href={mode.id === "smart" ? "/study" : `/study?mode=${mode.id}`}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
            mode.id === active
              ? "bg-white/15 text-white border border-white/20 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
          )}
          aria-current={mode.id === active ? "page" : undefined}
        >
          <span>{t.modes[mode.id]}</span>
          {mode.recommended && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 border border-amber-500/30">
              {t.recommended}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
