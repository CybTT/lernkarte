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
      <section className="sheet-in flex flex-col gap-6 py-6">
        <Stamp tone="good">{t.study.doneTitle}</Stamp>
        <p className="text-2xl leading-snug sm:text-3xl">
          {fmtParts(t.study.doneScore, {
            total: answeredCount,
            correct: (
              <span key="correct" className="font-mono text-red">
                {correctCount}
              </span>
            ),
          })}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/dashboard" onClick={() => router.refresh()} className="btn">
            {t.study.backToDashboard}
          </Link>
          <Link href="/sentence" className="link text-sm">
            {t.dashboard.writeSentence}
          </Link>
          <Link href="/dictionary" className="link text-sm">
            {t.nav.dictionary}
          </Link>
        </div>
      </section>
    );
  }

  const progressVal = ((index + (feedback ? 1 : 0)) / items.length) * 100;

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      {/* Progress: a thin red line and the card count */}
      <div className="flex items-center gap-4">
        <div className="h-[2px] flex-1 bg-text/10">
          <div className="h-full bg-red transition-[width] duration-500" style={{ width: `${progressVal}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-text">
          {index + 1} / {items.length}
        </span>
      </div>

      {!feedback ? (
        <div className="flex flex-col gap-4">
          <StudyCard
            key={item.word.id + index}
            item={item}
            disabled={submitting || problem !== null}
            onAnswer={handleAnswer}
          />
          {submitting && <p className="label mx-auto animate-pulse">{t.study.checking}</p>}
          {problem && (
            <div role="alert" className="mx-auto flex w-full max-w-xl flex-col gap-4 border-l-2 border-red pl-4">
              <p className="text-sm text-text">{problem.message}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {problem.retry && (
                  <button onClick={problem.retry} disabled={submitting} className="btn">
                    {t.common.retry}
                  </button>
                )}
                <button onClick={handleSkip} disabled={submitting} className="link text-sm text-muted-text">
                  {t.study.skip}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
          <WordFullCard
            word={feedback.word}
            stamp={
              <Stamp tone={feedback.correct ? "good" : "red"}>
                {feedback.correct ? t.study.correct : t.study.wrong}
              </Stamp>
            }
          />

          {feedback.gradeFeedback && <p className="hand text-2xl text-text/90">{feedback.gradeFeedback}</p>}

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-muted-text">
              {Math.round(feedback.masteryBefore)} → {Math.round(feedback.masteryAfter)}
            </span>
            <MasteryBar mastery={feedback.masteryAfter} className="flex-1" />
          </div>

          <button onClick={handleNext} autoFocus className="btn self-start">
            {t.study.continue}
          </button>
        </div>
      )}
    </div>
  );
}

/** A teacher's stamp in handwriting, landing at a slight angle. */
function Stamp({ tone, children }: { tone: "good" | "red"; children: React.ReactNode }) {
  return (
    <span
      className={`stamp hand inline-block -rotate-6 rounded-[3px] border-2 px-3 py-0.5 text-3xl font-bold leading-tight ${
        tone === "good" ? "border-good text-good" : "border-red text-red"
      }`}
    >
      {children}
    </span>
  );
}
