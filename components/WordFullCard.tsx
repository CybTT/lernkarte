import type { Word } from "@/lib/types";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { MeaningWithVariants } from "@/components/MeaningWithVariants";

/** Order matches the dictionary row: article, word, pronunciation, meaning, usage. */
export function WordFullCard({ word }: { word: Word }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <ArticleBadge article={word.article} />
        <span>{word.term}</span>
        {word.plural && <span className="text-sm text-muted-foreground">Pl. {word.plural}</span>}
        <SpeakButton text={word.term} className="ml-auto" />
      </div>

      {word.ipa && <p className="font-mono text-sm text-muted-foreground">[{word.ipa}]</p>}

      <p className="text-sm">
        <MeaningWithVariants meaning={word.meaning_tr} others={word.meanings_tr} />
        {word.meaning_en && <span className="text-muted-foreground"> · {word.meaning_en}</span>}
      </p>

      {word.usage_note && (
        <p className="text-xs text-muted-foreground">{word.usage_note}</p>
      )}

      {word.example_de && (
        <div className="mt-2 flex items-start gap-2 rounded-md bg-secondary p-3 text-sm">
          <div className="flex-1">
            <p>{word.example_de}</p>
            {word.example_tr && <p className="text-muted-foreground">{word.example_tr}</p>}
          </div>
          <SpeakButton text={word.example_de} />
        </div>
      )}
    </div>
  );
}
