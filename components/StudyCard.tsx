"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudySessionItem, Word } from "@/lib/types";
import { answersMatch, makeCloze } from "@/lib/germanMatch";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DistractorWord {
  id: string;
  term: string;
  meaning_tr: string | null;
}

export interface StudyCardAnswer {
  correct: boolean;
  /** Set for translate answers, whose correctness is judged async by /api/grade. */
  pendingGrade?: Promise<{ correct: boolean; feedback: string }>;
}

interface StudyCardProps {
  item: StudySessionItem;
  distractorPool: DistractorWord[];
  disabled: boolean;
  onAnswer: (answer: StudyCardAnswer) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function MultipleChoiceQuestion({ item, distractorPool, disabled, onAnswer }: StudyCardProps) {
  const { word } = item;
  const options = useMemo(() => {
    const others = distractorPool.filter((w) => w.id !== word.id && w.meaning_tr);
    const distractors = shuffle(others)
      .slice(0, 3)
      .map((w) => w.meaning_tr as string);
    return shuffle([word.meaning_tr ?? "?", ...distractors]);
  }, [word.id, word.meaning_tr, distractorPool]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled) return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) {
        onAnswer({ correct: options[n - 1] === word.meaning_tr });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [options, word.meaning_tr, disabled, onAnswer]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-2 text-3xl font-semibold">
        <ArticleBadge article={word.article} />
        <span>{word.term}</span>
        <SpeakButton text={word.term} />
      </div>
      <p className="text-center text-sm text-muted-foreground">Doğru anlamı seç</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt, i) => (
          <Button
            key={opt + i}
            variant="secondary"
            size="lg"
            disabled={disabled}
            className="h-auto justify-start whitespace-normal py-3 text-left"
            onClick={() => onAnswer({ correct: opt === word.meaning_tr })}
          >
            <span className="mr-2 text-muted-foreground">{i + 1}</span>
            {opt}
          </Button>
        ))}
      </div>
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
    case "cloze":
      return <ClozeQuestion {...props} />;
    case "typing":
      return <TypingQuestion {...props} />;
    case "translate":
      return <TranslateQuestion {...props} />;
  }
}
