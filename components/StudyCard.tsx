"use client";

import { useEffect, useState } from "react";
import type { QuestionType, StudyItem, Word } from "@/lib/types";
import { answersMatch, makeCloze } from "@/lib/germanMatch";
import { requestGrade, type GradeOutcome } from "@/lib/grading";
import { useI18n } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { cn } from "@/lib/utils";

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

/** A German index card: red top rule with the question type, then the question. */
function IndexCard({
  type,
  className,
  children,
}: {
  type: QuestionType;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section className={cn("sheet sheet-in mx-auto w-full max-w-xl", className)}>
      <header className="sheet-head px-6 pb-2.5 pt-4">
        <span className="label">{t.questionTypes[type]}</span>
      </header>
      <div className="px-6 pb-7 pt-6 sm:px-8">{children}</div>
    </section>
  );
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
    <IndexCard type={item.question_type}>
      <p className="label">{t.study.whichGerman}</p>
      <h2 className="mt-2 text-4xl font-bold sm:text-5xl">{word.meaning_tr}</h2>
      <ol className="mt-7 border-t border-paper-ink/15">
        {options.map((opt, i) => (
          <li key={opt + i} className="border-b border-paper-ink/15">
            <button
              disabled={disabled}
              onClick={() => onAnswer({ correct: isCorrect(opt) })}
              className="group flex w-full items-baseline gap-4 rounded-[3px] py-3 text-left transition-colors hover:bg-paper-2 disabled:opacity-50"
            >
              <span className="w-4 font-mono text-xs text-muted-text group-hover:text-red">{i + 1}</span>
              <span lang="de" className="font-display text-xl font-semibold">
                {opt}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </IndexCard>
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

  const term = (
    <h2 lang="de" className="flex flex-wrap items-baseline gap-x-3 text-5xl font-bold [overflow-wrap:anywhere] sm:text-6xl">
      <ArticleBadge article={word.article} className="text-3xl" />
      <span className="min-w-0">{word.term}</span>
    </h2>
  );

  // Both faces share one grid cell, so the card is as tall as the taller face.
  return (
    <div className="flip mx-auto w-full max-w-xl">
      <div className="flip-inner" data-flipped={revealed}>
        <div className="flip-face" aria-hidden={revealed}>
          <IndexCard type="flashcard">
            <div className="flex items-start justify-between gap-3">
              {term}
              <SpeakButton text={word.term} className="mt-2" />
            </div>
            <button
              onClick={() => setRevealed(true)}
              disabled={disabled || revealed}
              tabIndex={revealed ? -1 : 0}
              className="btn mt-10"
            >
              {t.study.showAnswer}
            </button>
          </IndexCard>
        </div>

        <div className="flip-face flip-back" aria-hidden={!revealed}>
          <IndexCard type="flashcard" className="h-full">
            <p lang="de" className="font-display text-2xl font-semibold text-muted-text">
              {word.article ? `${word.article} ` : ""}
              {word.term}
            </p>
            <p className="mt-3 text-3xl font-semibold">{word.meaning_tr ?? ""}</p>
            {word.example_de && (
              <p lang="de" className="mt-4 italic text-muted-text">
                {word.example_de}
              </p>
            )}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                disabled={disabled || !revealed}
                tabIndex={revealed ? 0 : -1}
                onClick={() => onAnswer({ correct: false })}
                className="rounded-[3px] border border-red/60 py-3 text-sm font-semibold text-red transition-colors hover:bg-red/10"
              >
                {t.study.didntKnow}
              </button>
              <button
                disabled={disabled || !revealed}
                tabIndex={revealed ? 0 : -1}
                onClick={() => onAnswer({ correct: true })}
                className="btn"
              >
                {t.study.knew}
              </button>
            </div>
          </IndexCard>
        </div>
      </div>
    </div>
  );
}

function TypingLikeQuestion({
  type,
  showArticle = true,
  prompt,
  hint,
  word,
  correctAnswer,
  disabled,
  onAnswer,
}: {
  type: QuestionType;
  /** The article is a hint for "what is X in German?", but not inside a gap sentence. */
  showArticle?: boolean;
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
    <IndexCard type={type}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <p className="flex flex-wrap items-baseline gap-x-2 text-2xl font-semibold leading-snug sm:text-3xl">
            {showArticle && word.article && <ArticleBadge article={word.article} />}
            <span>{prompt}</span>
          </p>
          {hint && <p className="mt-2 text-muted-text">{hint}</p>}
        </div>
        <AnswerLine value={value} onChange={setValue} disabled={disabled} placeholder={t.study.answerPlaceholder} />
        <button type="submit" disabled={disabled || !value.trim()} className="btn self-start">
          {t.study.submit}
        </button>
      </form>
    </IndexCard>
  );
}

/** A ruled line on the card that the learner writes on, in handwriting. */
function AnswerLine({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <input
      autoFocus
      lang="de"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={placeholder}
      autoComplete="off"
      spellCheck={false}
      className="hand w-full border-0 border-b border-rule bg-transparent pb-1 text-3xl text-pen outline-none placeholder:text-paper-ink/30 focus-visible:border-red focus-visible:outline-none disabled:opacity-60"
    />
  );
}

function ClozeQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { t } = useI18n();
  const { word } = item;
  const cloze = word.example_de ? makeCloze(word.example_de, word.term) : { prompt: "", found: false };

  return (
    <TypingLikeQuestion
      type={item.question_type}
      showArticle={!cloze.found}
      prompt={cloze.found ? cloze.prompt : fmt(t.study.whatIsGerman, { meaning: word.meaning_tr ?? "" })}
      hint={cloze.found ? word.meaning_tr ?? undefined : undefined}
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
      type={item.question_type}
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
    <IndexCard type={item.question_type}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <p className="label">{t.study.translateTo}</p>
          <p className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl">{word.example_tr ?? word.meaning_tr}</p>
        </div>
        <AnswerLine value={value} onChange={setValue} disabled={disabled} placeholder={t.study.sentencePlaceholder} />
        <button type="submit" disabled={disabled || !value.trim()} className="btn self-start">
          {t.study.submit}
        </button>
      </form>
    </IndexCard>
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
    default:
      return null;
  }
}
