"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StudyItem } from "@/lib/types";
import type { GradeOutcome } from "@/lib/grading";
import { useI18n } from "@/components/I18nProvider";
import { fmtParts } from "@/lib/i18n";
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

/** Something went wrong before the answer could be recorded. Nothing was saved. */
interface ProblemState {
  message: string;
  /** Re-runs the failed step with the same answer; absent when retrying can't help. */
  retry?: () => void;
}

export function StudySession({ items }: { items: StudyItem[] }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [problem, setProblem] = useState<ProblemState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const startRef = useRef(0);
  const router = useRouter();
  const { t } = useI18n();

  const item = items[index];

  useEffect(() => {
    startRef.current = Date.now();
  }, [index]);

  /** Records a known verdict. On failure, offers to retry the save itself. */
  async function record(correct: boolean, responseMs: number, gradeFeedback?: string) {
    setSubmitting(true);
    setProblem(null);
    try {
      const result = await submitAnswer({
        wordId: item.word.id,
        questionType: item.question_type,
        correct,
        responseMs,
      });
      if (correct) setCorrectCount((c) => c + 1);
      setAnsweredCount((c) => c + 1);
      setFeedback({
        correct,
        word: result.word,
        masteryBefore: result.masteryBefore,
        masteryAfter: result.masteryAfter,
        gradeFeedback,
      });
    } catch {
      setProblem({
        message: t.study.saveFailed,
        retry: () => void record(correct, responseMs, gradeFeedback),
      });
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Asks the server to grade a free-text answer. If grading fails the answer
   * is NOT counted as wrong and the word is not demoted — the learner is told
   * it couldn't be graded and can retry or skip.
   */
  async function gradeThenRecord(grade: () => Promise<GradeOutcome>, responseMs: number) {
    setSubmitting(true);
    setProblem(null);
    const outcome = await grade();
    setSubmitting(false);

    if (outcome.status === "ok") {
      await record(outcome.correct, responseMs, outcome.feedback || undefined);
    } else {
      setProblem({
        message: t.study.gradeFailed,
        retry: () => void gradeThenRecord(grade, responseMs),
      });
    }
  }

  function handleAnswer(answer: StudyCardAnswer) {
    // Time to answer, measured before any server round-trip.
    const responseMs = Date.now() - startRef.current;
    if (answer.grade) {
      void gradeThenRecord(answer.grade, responseMs);
    } else {
      void record(answer.correct, responseMs);
    }
  }

  /** Moves on without recording anything for the current word. */
  function handleSkip() {
    setProblem(null);
    handleNext();
  }

  function handleNext() {
    if (index + 1 >= items.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFeedback(null);
      setProblem(null);
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
          <h1 className="font-display text-3xl font-bold text-white">{t.study.doneTitle}</h1>
          <p className="text-neutral-400 text-sm">
            {fmtParts(t.study.doneScore, {
              total: answeredCount,
              correct: (
                <span key="correct" className="text-emerald-400 font-bold font-mono">
                  {correctCount}
                </span>
              ),
            })}
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Link
            href="/dictionary"
            className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 px-6 py-2.5 text-sm font-medium transition-all"
          >
            {t.nav.dictionary}
          </Link>
          <Link
            href="/dashboard"
            onClick={() => router.refresh()}
            className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
          >
            <span>{t.study.backToDashboard}</span>
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
          <div className="flex w-full flex-col gap-4">
            <StudyCard
              key={item.word.id + index}
              item={item}
              disabled={submitting || problem !== null}
              onAnswer={handleAnswer}
            />
            {submitting && (
              <p className="text-center text-sm text-neutral-400 animate-pulse">{t.study.checking}</p>
            )}
            {problem && (
              <div
                role="alert"
                className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center"
              >
                <p className="text-sm text-amber-200">{problem.message}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {problem.retry && (
                    <button
                      onClick={problem.retry}
                      disabled={submitting}
                      className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-40"
                    >
                      {t.common.retry}
                    </button>
                  )}
                  <button
                    onClick={handleSkip}
                    disabled={submitting}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-neutral-300 transition-all hover:bg-white/10 disabled:opacity-40"
                  >
                    {t.study.skip}
                  </button>
                </div>
              </div>
            )}
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
              {feedback.correct ? t.study.correct : t.study.wrong}
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
              {t.study.continue}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
