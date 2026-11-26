"use client";

import type { Word } from "@/lib/types";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { MeaningWithVariants } from "@/components/MeaningWithVariants";
import { useI18n } from "@/components/I18nProvider";

/** The whole word on an index card, as shown after answering a question. */
export function WordFullCard({ word, stamp }: { word: Word; stamp?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <article className="sheet sheet-in w-full">
      <header className="sheet-head flex items-baseline justify-between gap-3 px-6 pb-2.5 pt-4">
        <span className="label">{word.part_of_speech ?? ""}</span>
        {word.ipa && <span className="label">[{word.ipa}]</span>}
      </header>
      {stamp && <div className="absolute right-5 top-10 sm:right-8">{stamp}</div>}
      <div className="flex flex-col gap-4 px-6 pb-7 pt-6 sm:px-8">
        <h3 lang="de" className="flex flex-wrap items-baseline gap-x-3 pr-24 text-4xl font-bold [overflow-wrap:anywhere]">
          <ArticleBadge article={word.article} className="text-2xl" />
          <span className="min-w-0">{word.term}</span>
          <SpeakButton text={word.term} className="self-center" />
        </h3>
        {word.plural && (
          <p lang="de" className="-mt-2 font-mono text-xs text-muted-text">
            {t.word.pluralShort} {word.plural}
          </p>
        )}

        <p className="text-xl">
          <MeaningWithVariants meaning={word.meaning_tr} others={word.meanings_tr} />
          {word.meaning_en && (
            <span lang="en" className="ml-3 text-base text-muted-text">
              {word.meaning_en}
            </span>
          )}
        </p>

        {word.usage_note && <p className="text-sm text-muted-text">{word.usage_note}</p>}

        {word.example_de && (
          <div className="flex items-start gap-2 border-t border-paper-ink/15 pt-4">
            <div className="flex-1">
              <p lang="de" className="italic">
                {word.example_de}
              </p>
              {word.example_tr && <p className="mt-1 text-sm text-muted-text">{word.example_tr}</p>}
            </div>
            <SpeakButton text={word.example_de} />
          </div>
        )}
      </div>
    </article>
  );
}
