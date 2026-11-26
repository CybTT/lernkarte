"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Word } from "@/lib/types";
import { MasteryBar } from "@/components/MasteryBar";
import { ArticleBadge } from "@/components/ArticleBadge";
import { AddWordForm } from "@/components/AddWordForm";
import { MeaningWithVariants } from "@/components/MeaningWithVariants";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";

const LEARNED_THRESHOLD = 85;

/** A small handwritten-looking margin tag; red marks a problem. */
function Tag({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "red" }) {
  return (
    <span
      className={cn(
        "ml-2 rounded-[3px] border px-1.5 py-px font-mono text-[10px] align-middle",
        tone === "red" ? "border-red/50 text-red" : "border-border text-muted-text"
      )}
    >
      {children}
    </span>
  );
}

function WordRow({ word }: { word: Word }) {
  const { t } = useI18n();
  return (
    <tr className="border-b border-border align-baseline transition-colors hover:bg-text/[0.03]">
      <td className="w-0 whitespace-nowrap py-3 pr-3 text-sm">
        <ArticleBadge article={word.article} />
      </td>
      <td className="py-3 pr-4">
        <Link href={`/word/${word.id}`} lang="de" className="link font-display text-lg font-semibold">
          {word.term}
        </Link>
        {word.needs_review && <Tag tone="red">{t.dictionary.badgeUnrecognized}</Tag>}
        {!word.enriched && !word.needs_review && <Tag>{t.dictionary.badgeUnprocessed}</Tag>}
        {word.is_leech && <Tag tone="red">{t.dictionary.badgeWeak}</Tag>}
      </td>
      <td className="hidden py-3 pr-4 font-mono text-xs text-muted-text sm:table-cell">
        {word.ipa ? `[${word.ipa}]` : ""}
      </td>
      <td className="py-3 pr-4 text-sm text-text/85">
        <MeaningWithVariants meaning={word.meaning_tr} others={word.meanings_tr} />
      </td>
      <td className="w-24 py-3 sm:w-32">
        <MasteryBar mastery={word.mastery} />
      </td>
      <td className="hidden max-w-xs truncate py-3 pl-4 text-xs text-muted-text lg:table-cell">
        {word.usage_note ?? ""}
      </td>
    </tr>
  );
}

function WordTable({ words }: { words: Word[] }) {
  const { t } = useI18n();
  if (words.length === 0) {
    return <p className="border-t border-border py-12 text-sm text-muted-text">{t.dictionary.empty}</p>;
  }
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-text/25 font-mono text-[11px] text-muted-text">
            <th scope="col" className="w-0 py-2 pr-3 font-normal">{t.dictionary.colArticle}</th>
            <th scope="col" className="py-2 pr-4 font-normal">{t.dictionary.colWord}</th>
            <th scope="col" className="hidden py-2 pr-4 font-normal sm:table-cell">{t.dictionary.colIpa}</th>
            <th scope="col" className="py-2 pr-4 font-normal">{t.dictionary.colMeaning}</th>
            <th scope="col" className="py-2 font-normal">{t.dictionary.colMastery}</th>
            <th scope="col" className="hidden py-2 pl-4 font-normal lg:table-cell">{t.dictionary.colUsage}</th>
          </tr>
        </thead>
        <tbody>
          {words.map((w) => (
            <WordRow key={w.id} word={w} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThemeGroups({ words }: { words: Word[] }) {
  const { t } = useI18n();
  const groups = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const w of words) {
      const key = w.theme ?? t.dictionary.themeOther;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [words, t]);

  if (groups.length === 0) {
    return <p className="border-t border-border py-12 text-sm text-muted-text">{t.dictionary.emptyThemes}</p>;
  }

  return (
    <div className="flex flex-col border-t border-border">
      {groups.map(([theme, items]) => (
        <details key={theme} className="group border-b border-border" open={groups.length <= 3}>
          <summary className="flex cursor-pointer select-none items-baseline justify-between gap-4 rounded-[3px] py-4">
            <span lang="de" className="font-display text-xl font-semibold">
              <span aria-hidden className="mr-2 inline-block font-mono text-sm text-red transition-transform group-open:rotate-90">›</span>
              {theme}
            </span>
            <span className="label">{fmt(t.dictionary.themeCount, { n: items.length })}</span>
          </summary>
          <div className="pb-4">
            <WordTable words={items} />
          </div>
        </details>
      ))}
    </div>
  );
}

export function DictionaryView({ words, initialTab = "all" }: { words: Word[]; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const { t } = useI18n();

  const leeches = words.filter((w) => w.is_leech);
  const learning = words.filter((w) => !w.is_leech && w.mastery < LEARNED_THRESHOLD);
  const mastered = words.filter((w) => w.mastery >= LEARNED_THRESHOLD);

  const TABS = [
    { id: "all", label: fmt(t.dictionary.tabAll, { n: words.length }) },
    { id: "leeches", label: fmt(t.dictionary.tabLeeches, { n: leeches.length }) },
    { id: "learning", label: fmt(t.dictionary.tabLearning, { n: learning.length }) },
    { id: "mastered", label: fmt(t.dictionary.tabMastered, { n: mastered.length }) },
    { id: "theme", label: t.dictionary.tabTheme },
  ];

  return (
    <div className="flex flex-col gap-10">
      <AddWordForm />

      <div className="flex flex-col gap-4">
        <div role="tablist" className="flex flex-wrap gap-x-5 gap-y-1 border-b border-border">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              role="tab"
              aria-selected={tab === tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={cn(
                "-mb-px rounded-[3px] border-b-2 py-2 text-sm transition-colors",
                tab === tabItem.id
                  ? "border-red text-text"
                  : "border-transparent text-muted-text hover:text-text"
              )}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {tab === "all" && <WordTable words={words} />}
        {tab === "leeches" && <WordTable words={leeches} />}
        {tab === "learning" && <WordTable words={learning} />}
        {tab === "mastered" && <WordTable words={mastered} />}
        {tab === "theme" && <ThemeGroups words={words} />}
      </div>
    </div>
  );
}
