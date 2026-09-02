"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StudyItem } from "@/lib/types";
import { submitAnswer } from "@/app/(app)/study/actions";
import { StudyCard, type StudyCardAnswer } from "@/components/StudyCard";
import { WordFullCard } from "@/components/WordFullCard";
import { MasteryBar } from "@/components/MasteryBar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface FeedbackState {
  correct: boolean;
  word: StudyItem["word"];
  masteryBefore: number;
  masteryAfter: number;
  gradeFeedback?: string;
}

export function StudySession({ items }: { items: StudyItem[] }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const startRef = useRef(0);
  const router = useRouter();

  const item = items[index];

  useEffect(() => {
    startRef.current = Date.now();
  }, [index]);

  async function handleAnswer(answer: StudyCardAnswer) {
    setSubmitting(true);
    let correct = answer.correct;
    let gradeFeedback: string | undefined;

    if (answer.pendingGrade) {
      try {
        const graded = await answer.pendingGrade;
        correct = graded.correct;
        gradeFeedback = graded.feedback;
      } catch {
        correct = false;
        gradeFeedback = "Değerlendirme başarısız oldu.";
      }
    }

    const responseMs = Date.now() - startRef.current;

    try {
      const result = await submitAnswer({
        wordId: item.word.id,
        questionType: item.question_type,
        correct,
        responseMs,
      });
      if (correct) setCorrectCount((c) => c + 1);
      setFeedback({
        correct,
        word: result.word,
        masteryBefore: result.masteryBefore,
        masteryAfter: result.masteryAfter,
        gradeFeedback,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (index + 1 >= items.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFeedback(null);
    }
  }

  useEffect(() => {
    if (!feedback) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Oturum tamamlandı 🎉</h1>
        <p className="text-muted-foreground">
          {items.length} kelimeden {correctCount} tanesini doğru bildin.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" render={<Link href="/dictionary" />} nativeButton={false}>
            Sözlük
          </Button>
          <Button
            render={<Link href="/" onClick={() => router.refresh()} />}
            nativeButton={false}
          >
            Panele dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-center gap-3">
        <Progress value={((index + (feedback ? 1 : 0)) / items.length) * 100} className="flex-1" />
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {index + 1}/{items.length}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        {!feedback ? (
          <div className="w-full">
            <StudyCard item={item} disabled={submitting} onAnswer={handleAnswer} />
          </div>
        ) : (
          <div className="flex w-full flex-col gap-4">
            <p
              className={
                feedback.correct
                  ? "text-center text-lg font-medium text-article-das"
                  : "text-center text-lg font-medium text-article-die"
              }
            >
              {feedback.correct ? "Doğru! ✓" : "Yanlış"}
            </p>
            {feedback.gradeFeedback && (
              <p className="text-center text-sm text-muted-foreground">{feedback.gradeFeedback}</p>
            )}
            <WordFullCard word={feedback.word} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {Math.round(feedback.masteryBefore)} → {Math.round(feedback.masteryAfter)}
              </span>
              <MasteryBar mastery={feedback.masteryAfter} className="flex-1" />
            </div>
            <Button onClick={handleNext} autoFocus>
              Devam (Enter)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
