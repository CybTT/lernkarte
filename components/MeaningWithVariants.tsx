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
            "rounded-[3px] font-mono text-[11px] text-muted-text underline decoration-dotted underline-offset-4",
            "transition-colors hover:text-current"
          )}
          aria-label={fmt(t.word.meaningsMore, { n: extras.length })}
        >
          +{extras.length}
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <p className="label">{t.word.meaningsAll}</p>
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
