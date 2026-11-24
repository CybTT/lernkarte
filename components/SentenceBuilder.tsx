"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Lightbulb, RotateCcw, Target, X } from "lucide-react";
import type { SentenceTask } from "@/lib/sentenceTasks";
import type { Evaluation, SentenceError, TargetWordCheck } from "@/lib/sentenceCheck";
import type { SentenceCheckResponse } from "@/app/api/sentence-check/route";
import type { Level } from "@/lib/types";
import { segmentSentence } from "@/lib/highlight";
import { newSentenceTask, setLevel } from "@/app/(app)/sentence/actions";
import { useI18n } from "@/components/I18nProvider";
import { ArticleBadge } from "@/components/ArticleBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmt, type Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 300;
const LEVELS: Level[] = ["A1", "A2", "B1"];

type Phase = "writing" | "checking" | "feedback";

interface Result extends SentenceCheckResponse {
  sentence: string;
  attemptNo: 1 | 2;
}

const VERDICT_STYLE: Record<Evaluation["verdict"], string> = {
  correct: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  minor: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  major: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

const ERROR_MARK: Record<Evaluation["verdict"], string> = {
  correct: "",
  minor: "decoration-amber-400 bg-amber-400/15 text-amber-100",
  major: "decoration-rose-400 bg-rose-400/15 text-rose-100",
};

export function SentenceBuilder({
  initialTask,
  initialLevel,
}: {
  initialTask: SentenceTask;
  initialLevel: Level;
}) {
  const { t } = useI18n();
  const [task, setTask] = useState(initialTask);
  const [level, setLevelState] = useState(initialLevel);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");
  const [attemptNo, setAttemptNo] = useState<1 | 2>(1);
  const [result, setResult] = useState<Result | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [loadingTask, startTaskTransition] = useTransition();

  async function check() {
    const sentence = text.trim();
    if (!sentence || phase === "checking") return;
    setPhase("checking");
    setProblem(null);
    try {
      const res = await fetch("/api/sentence-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.taskId,
          attempt_no: attemptNo,
          word_ids: task.words.map((w) => w.id),
          context: task.context,
          grammar_goal_id: task.grammarGoal?.id ?? null,
          sentence,
        }),
      });
      const data = (await res.json().catch(() => null)) as SentenceCheckResponse | null;
      if (!res.ok || !data?.evaluation) throw new Error("check failed");
      setResult({ ...data, sentence, attemptNo });
      setRevealed(false);
      setPhase("feedback");
    } catch {
      // Nothing was recorded; the learner keeps their sentence and can retry.
      setProblem(t.sentence.failed);
      setPhase("writing");
    }
  }

  function tryAgain() {
    setAttemptNo(2);
    setPhase("writing");
  }

  function nextTask() {
    const avoid = task.words.map((w) => w.id);
    startTaskTransition(async () => {
      try {
        const next = await newSentenceTask(avoid);
        if (next) setTask(next);
      } catch {
        setProblem(t.sentence.failed);
        return;
      }
      setText("");
      setAttemptNo(1);
      setResult(null);
      setRevealed(false);
      setProblem(null);
      setPhase("writing");
    });
  }

  function changeLevel(next: Level) {
    setLevelState(next);
    void setLevel(next).catch(() => setLevelState(level));
  }

  const evaluation = result?.evaluation ?? null;
  // Corrections stay hidden after a flawed first try until the learner has
  // had their second go or asks to see them.
  const final =
    evaluation !== null &&
    (evaluation.verdict === "correct" || result?.attemptNo === 2 || revealed);

  return (
    <div className="flex flex-col gap-6">
      {/* Level */}
      <div className="flex items-center gap-3 self-start rounded-full border border-white/10 bg-[#121318] p-1.5 pl-4">
        <span className="text-xs font-medium text-neutral-400">{t.sentence.level}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={t.sentence.level}>
          {LEVELS.map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={level === l}
              onClick={() => changeLevel(l)}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-xs font-semibold transition-all",
                level === l
                  ? "border border-white/20 bg-white/15 text-white"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Task */}
      <section className="polkadot-card flex flex-col gap-5 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t.sentence.situation}
          </span>
          <p className="text-lg font-medium text-white">{task.context}</p>
        </div>

        {task.grammarGoal && (
          <div className="flex items-center gap-2 self-start rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-200">
            <Target className="h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-semibold">{t.sentence.grammarGoal}:</span> {task.grammarGoal.instruction}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t.sentence.targetWords}
          </span>
          <div className="flex flex-wrap gap-2">
            {task.words.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-baseline gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5"
              >
                <ArticleBadge article={w.article} className="text-sm" />
                <span className="font-display text-lg font-bold text-white">{w.term}</span>
                {w.meaning_tr && <span className="text-xs text-neutral-400">· {w.meaning_tr}</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Writing */}
      {phase !== "feedback" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void check();
          }}
          className="flex flex-col gap-3"
        >
          {attemptNo === 2 && (
            <span className="self-start rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
              {t.sentence.secondTry}
            </span>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void check();
              }
            }}
            disabled={phase === "checking"}
            rows={3}
            autoFocus
            lang="de"
            spellCheck={false}
            placeholder={t.sentence.placeholder}
            aria-label={t.sentence.placeholder}
            className="w-full resize-none rounded-2xl border border-white/10 bg-[#121318] p-4 text-lg text-white placeholder:text-neutral-500 transition-all focus:border-white/30 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={phase === "checking" || !text.trim()}
            className="rounded-full border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-40"
          >
            {phase === "checking" ? t.sentence.checking : t.sentence.check}
          </button>
          {problem && (
            <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm text-amber-200">
              {problem}
            </p>
          )}
        </form>
      )}

      {/* Feedback */}
      {phase === "feedback" && result && evaluation && (
        <Feedback
          t={t}
          result={result}
          evaluation={evaluation}
          final={final}
          onTryAgain={tryAgain}
          onReveal={() => setRevealed(true)}
          onNext={nextTask}
          loadingNext={loadingTask}
          problem={problem}
        />
      )}
    </div>
  );
}

function Feedback({
  t,
  result,
  evaluation,
  final,
  onTryAgain,
  onReveal,
  onNext,
  loadingNext,
  problem,
}: {
  t: Dictionary;
  result: Result;
  evaluation: Evaluation;
  final: boolean;
  onTryAgain: () => void;
  onReveal: () => void;
  onNext: () => void;
  loadingNext: boolean;
  problem: string | null;
}) {
  const verdictLabel = {
    correct: t.sentence.verdictCorrect,
    minor: t.sentence.verdictMinor,
    major: t.sentence.verdictMajor,
  }[evaluation.verdict];
  const unlocated = evaluation.errors
    .map((error, index) => ({ error, index }))
    .filter(({ error }) => !error.located);
  const canRetry = result.attemptNo === 1 && evaluation.verdict !== "correct" && !final;

  return (
    <section className="polkadot-card flex flex-col gap-6 rounded-2xl p-6 sm:p-8" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", VERDICT_STYLE[evaluation.verdict])}>
          {verdictLabel}
        </span>
        {result.attemptNo === 2 && (
          <span className="text-xs text-neutral-500">{t.sentence.secondTry}</span>
        )}
      </div>

      {/* What went right comes first. */}
      <p className="text-sm text-neutral-200">{evaluation.praise}</p>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {t.sentence.yourSentence}
        </span>
        <HighlightedSentence
          t={t}
          sentence={result.sentence}
          errors={evaluation.errors}
          verdict={evaluation.verdict}
          final={final}
        />
        {evaluation.errors.some((e) => e.located) && (
          <p className="text-xs text-neutral-500">{t.sentence.tapHint}</p>
        )}
      </div>

      {unlocated.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t.sentence.otherErrors}
          </span>
          <ul className="flex flex-col gap-2">
            {unlocated.map(({ error, index }) => (
              <li key={index} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <ErrorDetails t={t} error={error} final={final} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <TargetWords t={t} checks={evaluation.targetWords} mastery={result.mastery} />

      {evaluation.grammarGoalMet !== null && (
        <p
          className={cn(
            "flex items-start gap-2 text-sm",
            evaluation.grammarGoalMet ? "text-sky-200" : "text-neutral-300"
          )}
        >
          <Target className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">
              {evaluation.grammarGoalMet ? t.sentence.goalMet : t.sentence.goalNotMet}
            </span>
            {evaluation.grammarGoalNote && <> — {evaluation.grammarGoalNote}</>}
          </span>
        </p>
      )}

      {final && evaluation.verdict !== "correct" && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
            {t.sentence.corrected}
          </span>
          <p lang="de" className="text-lg font-medium text-white">
            {evaluation.corrected}
          </p>
        </div>
      )}

      {/* A style tip is shown apart from the errors, never as one. */}
      {final && evaluation.suggestion && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-300/80">
            <Lightbulb className="h-3.5 w-3.5" />
            {t.sentence.suggestion}
          </span>
          <p lang="de" className="text-base text-white">
            {evaluation.suggestion}
          </p>
          <p className="text-xs text-neutral-400">{t.sentence.suggestionNote}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {canRetry && <p className="text-center text-xs text-neutral-400">{t.sentence.tryAgainHint}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          {canRetry && (
            <>
              <button
                onClick={onTryAgain}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                {t.sentence.tryAgain}
              </button>
              <button
                onClick={onReveal}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-neutral-300 transition-all hover:bg-white/10"
              >
                {t.sentence.showCorrection}
              </button>
            </>
          )}
          {!canRetry && (
            <button
              onClick={onNext}
              disabled={loadingNext}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
            >
              {loadingNext ? t.common.loading : t.sentence.newTask}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        {problem && (
          <p role="alert" className="text-center text-sm text-amber-200">
            {problem}
          </p>
        )}
      </div>
    </section>
  );
}

function HighlightedSentence({
  t,
  sentence,
  errors,
  verdict,
  final,
}: {
  t: Dictionary;
  sentence: string;
  errors: SentenceError[];
  verdict: Evaluation["verdict"];
  final: boolean;
}) {
  const segments = segmentSentence(
    sentence,
    errors.map((e) => (e.located ? e.fragment : null))
  );
  return (
    <p lang="de" className="text-xl leading-relaxed text-white">
      {segments.map((segment, i) =>
        segment.errorIndex === null ? (
          <span key={i}>{segment.text}</span>
        ) : (
          <Popover key={i}>
            <PopoverTrigger
              openOnHover
              delay={100}
              className={cn(
                "cursor-help rounded px-0.5 underline decoration-wavy decoration-2 underline-offset-4 transition-colors",
                ERROR_MARK[verdict]
              )}
            >
              {segment.text}
            </PopoverTrigger>
            <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] border border-white/10 bg-[#15161c] text-neutral-200">
              <ErrorDetails t={t} error={errors[segment.errorIndex]} final={final} />
            </PopoverContent>
          </Popover>
        )
      )}
    </p>
  );
}

function ErrorDetails({ t, error, final }: { t: Dictionary; error: SentenceError; final: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
        {t.errorTypes[error.type]}
      </span>
      {!error.located && (
        <span lang="de" className="font-medium text-white">
          „{error.fragment}“
        </span>
      )}
      <p>{error.explanation}</p>
      {error.rule && (
        <p className="text-xs text-neutral-400">
          <span className="font-semibold">{t.sentence.rule}:</span> {error.rule}
        </p>
      )}
      {final && error.correction && (
        <p className="text-emerald-300">
          <span className="font-semibold">{t.sentence.correction}:</span>{" "}
          <span lang="de">{error.correction}</span>
        </p>
      )}
    </div>
  );
}

function TargetWords({
  t,
  checks,
  mastery,
}: {
  t: Dictionary;
  checks: TargetWordCheck[];
  mastery: SentenceCheckResponse["mastery"];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {t.sentence.wordCheck}
      </span>
      <ul className="flex flex-col gap-2">
        {checks.map((c) => {
          const ok = c.used && c.correctMeaning && c.correctForm;
          const status = ok
            ? t.sentence.wordOk
            : !c.used
              ? t.sentence.wordNotUsed
              : !c.correctMeaning
                ? t.sentence.wordWrongMeaning
                : t.sentence.wordWrongForm;
          const change = mastery.find((m) => m.term === c.term);
          return (
            <li key={c.term} className="flex items-start gap-2 text-sm">
              {ok ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span className="text-neutral-200">
                <span lang="de" className="font-semibold text-white">
                  {c.term}
                </span>{" "}
                — {status}
                {c.note && <span className="text-neutral-400"> · {c.note}</span>}
                {change && (
                  <span className="ml-2 font-mono text-xs text-neutral-500">
                    {fmt(t.sentence.masteryChange, {
                      before: Math.round(change.before),
                      after: Math.round(change.after),
                    })}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
