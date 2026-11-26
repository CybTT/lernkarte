import type { CSSProperties } from "react";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";

interface GermanyFlagBlankProps {
  t: Dictionary["flag"];
  /** Average mastery of all words, 0–100. */
  realProgress: number;
  totalWords: number;
  masteredWords: number;
  learningWords: number;
}

/**
 * The German flag fills from left to right as the learner's average mastery
 * grows. The fill animates in on load; the empty part stays hatched.
 */
export function GermanyFlagBlank({
  t,
  realProgress,
  totalWords,
  masteredWords,
  learningWords,
}: GermanyFlagBlankProps) {
  const progress = Math.round(Math.min(100, Math.max(0, realProgress)));
  const percent = fmt(t.percent, { n: progress });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <p className="label">{t.title}</p>
          <p className="font-mono text-5xl leading-none tabular-nums">{percent}</p>
        </div>
        <p className="text-sm text-muted-text">
          {progress === 100 ? t.complete : fmt(t.wordsDone, { done: masteredWords, total: totalWords })}
        </p>
      </div>

      <div
        role="img"
        aria-label={`${t.title}: ${percent}`}
        className="relative h-16 overflow-hidden rounded-[3px] border border-border sm:h-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 7px, rgba(239,233,222,0.07) 7px 8px)",
        }}
      >
        <div
          className="flag-fill absolute inset-y-0 left-0 grid grid-rows-3"
          style={{ "--progress": `${progress}%` } as CSSProperties}
        >
          <span className="bg-[#050505]" />
          <span className="bg-[#dd0000]" />
          <span className="bg-[#ffcc00]" />
        </div>
      </div>

      <dl className="grid grid-cols-2 border-y border-border">
        <div className="py-3 pr-4">
          <dt className="label">{t.learned}</dt>
          <dd className="font-mono text-2xl tabular-nums">{masteredWords}</dd>
        </div>
        <div className="border-l border-border py-3 pl-4">
          <dt className="label">{t.learning}</dt>
          <dd className="font-mono text-2xl tabular-nums">{learningWords}</dd>
        </div>
      </dl>
    </section>
  );
}
