"use client";

import { useEffect, useState } from "react";
import type { StudyItem, Word } from "@/lib/types";
import { answersMatch, makeCloze } from "@/lib/germanMatch";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface StudyCardAnswer {
  correct: boolean;
  /** Set for translate answers, whose correctness is judged async by /api/grade. */
  pendingGrade?: Promise<{ correct: boolean; feedback: string }>;
}

interface StudyCardProps {
  item: StudyItem;
  disabled: boolean;
  onAnswer: (answer: StudyCardAnswer) => void;
}

/**
 * Multiple choice runs Turkish -> German: the meaning is the prompt and the
 * options are German words. The three wrong options are drawn server-side from
 * the shared dictionary_pool (same part of speech, similar length).
 */
function MultipleChoiceQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { word, options = [] } = item;

  // The correct option is capitalised server-side for nouns, so compare
  // case-insensitively (but not umlaut-folded — "schon" must not match "schön").
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">Bunun Almancası hangisi?</p>
        <p className="text-3xl font-semibold">{word.meaning_tr}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt, i) => (
          <Button
            key={opt + i}
            variant="secondary"
            size="lg"
            disabled={disabled}
            className="h-auto justify-start whitespace-normal py-3 text-left"
            onClick={() => onAnswer({ correct: isCorrect(opt) })}
          >
            <span className="mr-2 text-muted-foreground">{i + 1}</span>
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}

function FlashcardQuestion({ item, disabled, onAnswer }: StudyCardProps) {
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-2 text-3xl font-semibold">
        <ArticleBadge article={word.article} />
        <span>{word.term}</span>
        <SpeakButton text={word.term} />
      </div>

      {!revealed ? (
        <div className="flex flex-col items-center gap-3">
          <Button onClick={() => setRevealed(true)} disabled={disabled}>
            Cevabı göster (Space)
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xl">{word.meaning_tr ?? "—"}</p>
            {word.example_de && (
              <p className="text-sm text-muted-foreground">{word.example_de}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => onAnswer({ correct: false })}
            >
              Bilmedim (1)
            </Button>
            <Button disabled={disabled} onClick={() => onAnswer({ correct: true })}>
              Bildim (2)
            </Button>
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
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onAnswer({ correct: answersMatch(value, correctAnswer) });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          {word.article && <ArticleBadge article={word.article} />}
          <p className="text-xl">{prompt}</p>
        </div>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Almanca yaz…"
        className="text-center text-lg"
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Gönder (Enter)
      </Button>
    </form>
  );
}

function ClozeQuestion({ item, disabled, onAnswer }: StudyCardProps) {
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

  // Fallback when we don't have a usable example sentence yet.
  return (
    <TypingLikeQuestion
      prompt={`"${word.meaning_tr}" kelimesinin Almancası ne?`}
      word={word}
      correctAnswer={word.term}
      disabled={disabled}
      onAnswer={onAnswer}
    />
  );
}

function TypingQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { word } = item;
  return (
    <TypingLikeQuestion
      prompt={`"${word.meaning_tr}" kelimesinin Almancası ne?`}
      word={word}
      correctAnswer={word.term}
      disabled={disabled}
      onAnswer={onAnswer}
    />
  );
}

function TranslateQuestion({ item, disabled, onAnswer }: StudyCardProps) {
  const { word } = item;
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    if (!word.example_de) {
      onAnswer({ correct: answersMatch(value, word.term) });
      return;
    }
    const pendingGrade = fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term: word.term,
        expected_meaning: word.example_de,
        answer: value,
      }),
    }).then((r) => r.json());
    onAnswer({ correct: false, pendingGrade });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">Almancaya çevir:</p>
        <p className="text-xl">{word.example_tr ?? word.meaning_tr}</p>
      </div>
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Almanca cümle yaz…"
        className="text-center text-lg"
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Gönder (Enter)
      </Button>
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
