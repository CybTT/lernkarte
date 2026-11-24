import type { Word } from "@/lib/types";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { MeaningWithVariants } from "@/components/MeaningWithVariants";

export function WordFullCard({ word }: { word: Word }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#121318]/90 p-6 text-neutral-200">
      <div className="flex items-center gap-3 text-2xl font-bold font-display text-white">
        <ArticleBadge article={word.article} className="text-xl" />
        <span>{word.term}</span>
        {word.plural && <span className="text-sm font-normal text-neutral-400 font-mono">Pl. {word.plural}</span>}
        <SpeakButton text={word.term} className="ml-auto" />
      </div>

      {word.ipa && <p className="font-mono text-xs text-neutral-400">[{word.ipa}]</p>}

      <div className="text-base text-neutral-200">
        <MeaningWithVariants meaning={word.meaning_tr} others={word.meanings_tr} />
        {word.meaning_en && <span className="text-neutral-400 text-sm"> · {word.meaning_en}</span>}
      </div>

      {word.usage_note && (
        <p className="text-xs text-neutral-400 bg-white/5 p-2.5 rounded-lg border border-white/5">{word.usage_note}</p>
      )}

      {word.example_de && (
        <div className="mt-1 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <div className="flex-1 space-y-1">
            <p className="font-medium text-white">"{word.example_de}"</p>
            {word.example_tr && <p className="text-neutral-400 text-xs">{word.example_tr}</p>}
          </div>
          <SpeakButton text={word.example_de} />
        </div>
      )}
    </div>
  );
}
