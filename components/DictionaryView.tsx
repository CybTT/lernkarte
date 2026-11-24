"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Word } from "@/lib/types";
import { MasteryBar } from "@/components/MasteryBar";
import { ArticleBadge } from "@/components/ArticleBadge";
import { AddWordForm } from "@/components/AddWordForm";
import { MeaningWithVariants } from "@/components/MeaningWithVariants";
import { cn } from "@/lib/utils";

const LEARNED_THRESHOLD = 85;

function WordRow({ word }: { word: Word }) {
  return (
    <tr className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]">
      <td className="py-3 px-4 w-0 whitespace-nowrap font-semibold">
        <ArticleBadge article={word.article} />
      </td>
      <td className="py-3 px-4 font-medium text-white">
        <Link href={`/word/${word.id}`} className="hover:underline hover:text-amber-300 transition-colors">
          {word.term}
        </Link>
        {word.needs_review && (
          <span className="ml-2 inline-flex items-center rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/30">
            tanınmadı
          </span>
        )}
        {!word.enriched && !word.needs_review && (
          <span className="ml-2 inline-flex items-center rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400 border border-white/10">
            işlenmemiş
          </span>
        )}
        {word.is_leech && (
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/30">
            zayıf
          </span>
        )}
      </td>
      <td className="py-3 px-4 hidden font-mono text-xs text-neutral-400 sm:table-cell">
        {word.ipa ? `[${word.ipa}]` : "—"}
      </td>
      <td className="py-3 px-4 text-neutral-300 text-sm">
        <MeaningWithVariants meaning={word.meaning_tr} others={word.meanings_tr} />
      </td>
      <td className="py-3 px-4 w-32">
        <MasteryBar mastery={word.mastery} />
      </td>
      <td className="py-3 px-4 hidden max-w-xs text-xs text-neutral-400 lg:table-cell truncate">
        {word.usage_note ?? "—"}
      </td>
    </tr>
  );
}

function WordTable({ words }: { words: Word[] }) {
  if (words.length === 0) {
    return <p className="text-sm text-neutral-500 py-12 text-center">Burada henüz kelime yok.</p>;
  }
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#101116]/80 backdrop-blur-md">
      <table className="w-full text-left text-sm text-neutral-200">
        <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4 w-0">Artikel</th>
            <th className="py-3 px-4">Kelime</th>
            <th className="py-3 px-4 hidden sm:table-cell">Okunuş</th>
            <th className="py-3 px-4">Anlam</th>
            <th className="py-3 px-4">Ustalık</th>
            <th className="py-3 px-4 hidden lg:table-cell">Kullanım</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {words.map((w) => (
            <WordRow key={w.id} word={w} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThemeGroups({ words }: { words: Word[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const w of words) {
      const key = w.theme ?? "Diğer";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [words]);

  if (groups.length === 0) {
    return <p className="text-sm text-neutral-500 py-12 text-center">Henüz temalanmış kelime yok.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([theme, items]) => (
        <details key={theme} className="rounded-xl border border-white/10 bg-[#101116] overflow-hidden" open={groups.length <= 3}>
          <summary className="cursor-pointer select-none px-5 py-4 font-medium flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <span className="text-white font-semibold">{theme}</span>
            <span className="text-xs text-neutral-400 font-mono">{items.length} kelime</span>
          </summary>
          <div className="p-3 pt-0">
            <WordTable words={items} />
          </div>
        </details>
      ))}
    </div>
  );
}

export function DictionaryView({ words, initialTab = "all" }: { words: Word[]; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);

  const leeches = words.filter((w) => w.is_leech);
  const learning = words.filter((w) => !w.is_leech && w.mastery < LEARNED_THRESHOLD);
  const mastered = words.filter((w) => w.mastery >= LEARNED_THRESHOLD);

  const TABS = [
    { id: "all", label: `Tümü (${words.length})` },
    { id: "leeches", label: `Zayıflar (${leeches.length})` },
    { id: "learning", label: `Öğrenilmekte (${learning.length})` },
    { id: "mastered", label: `Öğrenilmiş (${mastered.length})` },
    { id: "theme", label: "Tema" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AddWordForm />

      {/* Dark Pill Tabs Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-white/10 bg-[#121318] p-1.5 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
                tab === t.id
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              )}
            >
              {t.label}
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
