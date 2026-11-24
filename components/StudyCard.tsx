"use client";

import { useEffect, useState } from "react";
import type { StudyItem, Word } from "@/lib/types";
import { answersMatch, makeCloze } from "@/lib/germanMatch";
import { requestGrade, type GradeOutcome } from "@/lib/grading";
import { useI18n } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";

export interface StudyCardAnswer {
  correct: boolean;
  /**
   * For free-text answers the server decides; `correct` is ignored then.
   * A function (not a promise) so the session can retry the same answer.
   */
  grade?: () => Promise<GradeOutcome>;
}

interface StudyCardProps {
  item: StudyItem;
  disabled: boolean;
  onAnswer: (answer: StudyCardAnswer) => void;
}

function MultipleChoiceQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { t } = useI18n();
  const { word, options = [] } = item;
  const isCorrect = (option: string) => option.toLowerCase() === word.term.toLowerCase();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled) return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) {
        onAnswer({ correct: options[n - 1].toLowerCase() === word.term.toLowerCase() });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [options, word.term, disabled, onAnswer]);

  return (
    <div className="polkadot-card flex flex-col gap-8 p-8 sm:p-10 rounded-2xl w-full max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
          {t.study.whichGerman}
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
          {word.meaning_tr}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt, i) => (
          <button
            key={opt + i}
            disabled={disabled}
            onClick={() => onAnswer({ correct: isCorrect(opt) })}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 disabled:opacity-40"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-mono text-neutral-300">
              {i + 1}
            </span>
            <span className="text-base">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FlashcardQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { t } = useI18n();
  const { word } = item;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled) return;
      if (!revealed) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      if (e.key === "1") onAnswer({ correct: false });
      if (e.key === "2") onAnswer({ correct: true });
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [revealed, disabled, onAnswer]);

  return (
    <div className="polkadot-card flex flex-col gap-8 p-8 sm:p-10 rounded-2xl w-full max-w-xl mx-auto text-center">
      <div className="flex flex-wrap items-center justify-center gap-3 text-4xl sm:text-5xl font-display font-bold text-white">
        <ArticleBadge article={word.article} className="text-2xl sm:text-3xl" />
        <span className="min-w-0 [overflow-wrap:anywhere]">{word.term}</span>
        <SpeakButton text={word.term} />
      </div>

      {!revealed ? (
        <div className="flex flex-col items-center gap-3 mt-4">
          <button
            onClick={() => setRevealed(true)}
            disabled={disabled}
            className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-8 py-3 text-sm font-medium transition-all hover:scale-105"
          >
            {t.study.showAnswer}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mt-2">
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl font-medium text-white">{word.meaning_tr ?? "—"}</p>
            {word.example_de && (
              <p className="text-sm text-neutral-400 italic">&ldquo;{word.example_de}&rdquo;</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={disabled}
              onClick={() => onAnswer({ correct: false })}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 py-3 font-medium transition-all"
            >
              {t.study.didntKnow}
            </button>
            <button
              disabled={disabled}
              onClick={() => onAnswer({ correct: true })}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 py-3 font-medium transition-all"
            >
              {t.study.knew}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TypingLikeQuestion({
  prompt,
  hint,
  word,
  correctAnswer,
  disabled,
  onAnswer,
}: {
  prompt: string;
  hint?: string;
  word: Word;
  correctAnswer: string;
  disabled: boolean;
  onAnswer: (answer: StudyCardAnswer) => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onAnswer({ correct: answersMatch(value, correctAnswer) });
  }

  return (
    <form onSubmit={handleSubmit} className="polkadot-card flex flex-col gap-6 p-8 sm:p-10 rounded-2xl w-full max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-xl font-medium text-white">
          {word.article && <ArticleBadge article={word.article} />}
          <p>{prompt}</p>
        </div>
        {hint && <p className="text-sm text-neutral-400">{hint}</p>}
      </div>

      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={t.study.answerPlaceholder}
        className="w-full rounded-xl border border-white/10 bg-[#121318] p-4 text-center text-lg text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none transition-all"
      />

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white py-3 text-sm font-medium transition-all disabled:opacity-40"
      >
        {t.study.submit}
      </button>
    </form>
  );
}

function ClozeQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { t } = useI18n();
  const { word } = item;
  const cloze = word.example_de ? makeCloze(word.example_de, word.term) : { prompt: "", found: false };

  if (cloze.found) {
    return (
      <TypingLikeQuestion
        prompt={cloze.prompt}
        hint={word.meaning_tr ?? undefined}
        word={word}
        correctAnswer={word.term}
        disabled={disabled}
        onAnswer={onAnswer}
      />
    );
  }

  return (
    <TypingLikeQuestion
      prompt={fmt(t.study.whatIsGerman, { meaning: word.meaning_tr ?? "" })}
      word={word}
      correctAnswer={word.term}
      disabled={disabled}
      onAnswer={onAnswer}
    />
  );
}

function TypingQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { t } = useI18n();
  const { word } = item;
  return (
    <TypingLikeQuestion
      prompt={fmt(t.study.whatIsGerman, { meaning: word.meaning_tr ?? "" })}
      word={word}
      correctAnswer={word.term}
      disabled={disabled}
      onAnswer={onAnswer}
    />
  );
}

function TranslateQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { t } = useI18n();
  const { word } = item;
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    if (!word.example_de) {
      onAnswer({ correct: answersMatch(value, word.term) });
      return;
    }
    const expected = word.example_de;
    onAnswer({ correct: false, grade: () => requestGrade(word.term, expected, value) });
  }

  return (
    <form onSubmit={handleSubmit} className="polkadot-card flex flex-col gap-6 p-8 sm:p-10 rounded-2xl w-full max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {t.study.translateTo}
        </span>
        <p className="text-xl font-medium text-white">{word.example_tr ?? word.meaning_tr}</p>
      </div>

      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={t.study.sentencePlaceholder}
        className="w-full rounded-xl border border-white/10 bg-[#121318] p-4 text-center text-lg text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none transition-all"
      />

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white py-3 text-sm font-medium transition-all disabled:opacity-40"
      >
        {t.study.submit}
      </button>
    </form>
  );
}

export function StudyCard(props: StudyCardProps) {
  switch (props.item.question_type) {
    case "match":
    case "multiple_choice":
      return <MultipleChoiceQuestion {...props} />;
    case "flashcard":
      return <FlashcardQuestion {...props} />;
    case "cloze":
      return <ClozeQuestion {...props} />;
    case "typing":
      return <TypingQuestion {...props} />;
    case "translate":
      return <TranslateQuestion {...props} />;
  }
}
