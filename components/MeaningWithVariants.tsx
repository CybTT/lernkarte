"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";

/**
 * Primary Turkish meaning, with a small "+N" affordance when the word carries
 * further meanings. Clicking it opens the full list.
 */
export function MeaningWithVariants({
  meaning,
  others,
  className,
}: {
  meaning: string | null;
  others: string[] | null;
  className?: string;
}) {
  const { t } = useI18n();
  const extras = (others ?? []).filter((m) => m && m.trim() && m !== meaning);

  if (!meaning) return <span className="text-muted-foreground">—</span>;
  if (extras.length === 0) return <span className={className}>{meaning}</span>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={className}>{meaning}</span>
      <Popover>
        <PopoverTrigger
          className={cn(
            "rounded-full border border-border px-1.5 py-0.5 text-[10px] leading-none",
            "text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          )}
          aria-label={fmt(t.word.meaningsMore, { n: extras.length })}
        >
          +{extras.length}
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <p className="text-xs text-muted-foreground">{t.word.meaningsAll}</p>
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {[meaning, ...extras].map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </span>
  );
}
