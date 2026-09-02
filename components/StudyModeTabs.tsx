import Link from "next/link";
import type { StudyMode } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const STUDY_MODES: { id: StudyMode; label: string; recommended?: boolean }[] = [
  { id: "smart", label: "Akıllı Çalışma", recommended: true },
  { id: "flashcard", label: "Flashcard" },
  { id: "typing", label: "Yazma" },
  { id: "translate", label: "Çeviri" },
];

export function StudyModeTabs({ active }: { active: StudyMode }) {
  return (
    <nav className="flex flex-wrap gap-1" aria-label="Çalışma modu">
      {STUDY_MODES.map((mode) => (
        <Link
          key={mode.id}
          href={mode.id === "smart" ? "/study" : `/study?mode=${mode.id}`}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            mode.id === active
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={mode.id === active ? "page" : undefined}
        >
          {mode.label}
          {mode.recommended && (
            <Badge variant="outline" className="text-[10px]">
              önerilen
            </Badge>
          )}
        </Link>
      ))}
    </nav>
  );
}
