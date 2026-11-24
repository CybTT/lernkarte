"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StudyItem } from "@/lib/types";
import { submitAnswer } from "@/app/(app)/study/actions";
import { StudyCard, type StudyCardAnswer } from "@/components/StudyCard";
import { WordFullCard } from "@/components/WordFullCard";
import { MasteryBar } from "@/components/MasteryBar";
import { CheckCircle2, ArrowRight } from "lucide-react";

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
      <div className="polkadot-card flex flex-col items-center justify-center gap-6 p-10 rounded-2xl text-center max-w-lg mx-auto my-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold text-white">Oturum tamamlandı 🎉</h1>
          <p className="text-neutral-400 text-sm">
            {items.length} kelimeden <span className="text-emerald-400 font-bold font-mono">{correctCount}</span> tanesini doğru bildin.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Link
            href="/dictionary"
            className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 px-6 py-2.5 text-sm font-medium transition-all"
          >
            Sözlük
          </Link>
          <Link
            href="/"
            onClick={() => router.refresh()}
            className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
          >
            <span>Panele dön</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const progressVal = ((index + (feedback ? 1 : 0)) / items.length) * 100;

  return (
    <div className="flex flex-1 flex-col gap-8 w-full">
      
      {/* Sleek Progress Header */}
      <div className="flex items-center gap-4 w-full">
        <div className="h-2 flex-1 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
            style={{ width: `${progressVal}%` }}
          />
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-400 font-semibold">
          {index + 1} / {items.length}
        </span>
      </div>

      {/* Main Question Card or Feedback view */}
      <div className="flex flex-1 items-center justify-center">
        {!feedback ? (
          <div className="w-full">
            <StudyCard item={item} disabled={submitting} onAnswer={handleAnswer} />
          </div>
        ) : (
          <div className="polkadot-card flex w-full max-w-xl flex-col gap-6 p-8 rounded-2xl mx-auto">
            <p
              className={
                feedback.correct
                  ? "text-center text-xl font-bold text-emerald-400"
                  : "text-center text-xl font-bold text-rose-400"
              }
            >
              {feedback.correct ? "Doğru! ✓" : "Yanlış"}
            </p>
            
            {feedback.gradeFeedback && (
              <p className="text-center text-sm text-neutral-400">{feedback.gradeFeedback}</p>
            )}

            <WordFullCard word={feedback.word} />

            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-mono text-xs text-neutral-400">
                {Math.round(feedback.masteryBefore)}% → {Math.round(feedback.masteryAfter)}%
              </span>
              <MasteryBar mastery={feedback.masteryAfter} className="flex-1" />
            </div>

            <button
              onClick={handleNext}
              autoFocus
              className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white py-3 font-medium text-sm transition-all hover:scale-[1.02]"
            >
              Devam et (Enter)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
