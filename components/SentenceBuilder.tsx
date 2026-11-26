"use client";

import { useState, useTransition } from "react";
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

/*
 * The sentence exercise as a sheet from an exercise book: the learner writes
 * by hand on ruled lines, and the feedback comes back marked in red pen with
 * numbered margin notes and a teacher's stamp.
 */
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
    <div className="flex flex-col gap-8">
      {/* Level */}
      <div className="flex items-baseline gap-4" role="radiogroup" aria-label={t.sentence.level}>
        <span className="label">{t.sentence.level}</span>
        {LEVELS.map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={level === l}
            onClick={() => changeLevel(l)}
            className={cn(
              "rounded-[3px] border-b-2 font-mono text-sm transition-colors",
              level === l ? "border-red text-text" : "border-transparent text-muted-text hover:text-text"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <TaskCard t={t} task={task} />

      {phase !== "feedback" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void check();
          }}
          className="flex flex-col gap-4"
        >
          <div className="sheet">
            <div className="sheet-head flex items-baseline justify-between px-6 pb-2.5 pt-4">
              <span className="label">{t.sentence.yourSentence}</span>
              {attemptNo === 2 && <span className="hand text-xl text-red">{t.sentence.secondTry}</span>}
            </div>
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
              className="ruled hand block w-full resize-none bg-transparent px-6 pb-4 pt-2 text-[1.75rem] text-pen outline-none placeholder:text-paper-ink/30 disabled:opacity-60 sm:text-3xl"
              style={{ ["--line-h" as string]: "48px", backgroundAttachment: "local" }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={phase === "checking" || !text.trim()} className="btn">
              {phase === "checking" ? t.sentence.checking : t.sentence.check}
            </button>
            {phase === "checking" && <PenScribble />}
          </div>
          {problem && (
            <p role="alert" className="border-l-2 border-red pl-4 text-sm">
              {problem}
            </p>
          )}
        </form>
      )}

      {phase === "feedback" && result && evaluation && (
        <SentenceFeedback
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

/** A small red pen line being drawn over and over while Claude reads. */
function PenScribble() {
  return (
    <svg aria-hidden width="64" height="16" viewBox="0 0 64 16" className="text-red">
      <path
        d="M2 10 C 10 2, 16 14, 24 8 S 38 2, 46 9 S 58 12, 62 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={1}
        className="motion-safe:animate-[pen-loop_1.2s_ease-in-out_infinite]"
        style={{ strokeDasharray: 1, strokeDashoffset: 0 }}
      />
    </svg>
  );
}

/** The task as an index card: the situation, the words, and maybe a grammar goal in red pen. */
export function TaskCard({ t, task }: { t: Dictionary; task: Pick<SentenceTask, "context" | "grammarGoal" | "words"> }) {
  return (
    <section className="sheet sheet-in">
      <header className="sheet-head px-6 pb-2.5 pt-4">
        <span className="label">{t.sentence.situation}</span>
      </header>
      <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
        <p className="font-display text-2xl font-semibold leading-snug sm:text-[1.7rem]">{task.context}</p>
        {task.grammarGoal && (
          <p className="hand -mt-1 -rotate-1 text-2xl text-red">
            {t.sentence.grammarGoal}: {task.grammarGoal.instruction}
          </p>
        )}
        <div className="border-t border-paper-ink/15 pt-4">
          <p className="label mb-2">{t.sentence.targetWords}</p>
          <ul className="flex flex-col gap-1">
            {task.words.map((w) => (
              <li key={w.id} className="flex flex-wrap items-baseline gap-x-2">
                <span lang="de" className="font-display text-xl font-bold">
                  <ArticleBadge article={w.article} className="mr-1.5" />
                  {w.term}
                </span>
                {w.meaning_tr && <span className="text-sm text-muted-text">{w.meaning_tr}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Claude's feedback on one sentence, as a corrected sheet. `showActions: false` renders it for display only. */
export function SentenceFeedback({
  t,
  result,
  evaluation,
  final,
  onTryAgain,
  onReveal,
  onNext,
  loadingNext = false,
  problem = null,
  showActions = true,
}: {
  t: Dictionary;
  result: Pick<Result, "sentence" | "attemptNo" | "mastery">;
  evaluation: Evaluation;
  final: boolean;
  onTryAgain?: () => void;
  onReveal?: () => void;
  onNext?: () => void;
  loadingNext?: boolean;
  problem?: string | null;
  showActions?: boolean;
}) {
  const verdictLabel = {
    correct: t.sentence.verdictCorrect,
    minor: t.sentence.verdictMinor,
    major: t.sentence.verdictMajor,
  }[evaluation.verdict];
  const canRetry = result.attemptNo === 1 && evaluation.verdict !== "correct" && !final;

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <article className="sheet sheet-in">
        <header className="sheet-head flex items-baseline justify-between gap-3 px-6 pb-2.5 pt-4">
          <span className="label">
            {t.sentence.yourSentence}
            {result.attemptNo === 2 && ` · ${t.sentence.secondTry}`}
          </span>
        </header>

        <div className="px-6 pb-7 pt-5 sm:px-8">
          {/* The teacher's stamp; the praise flows around it. */}
          <span
            className={cn(
              "stamp hand float-right mb-3 ml-4 mt-1 rounded-[3px] border-2 px-2.5 text-2xl font-bold leading-tight sm:text-3xl",
              evaluation.verdict === "correct" ? "border-good text-good" : "border-red text-red"
            )}
          >
            {verdictLabel}
          </span>
          {/* What went right comes first, in the teacher's green pen. */}
          <p className="hand text-2xl leading-tight text-good">{evaluation.praise}</p>

          <MarkedSentence t={t} sentence={result.sentence} errors={evaluation.errors} final={final} />

          {final && evaluation.verdict !== "correct" && (
            <p lang="de" className="hand pen-write mt-1 text-2xl text-red sm:text-[1.7rem]">
              → {evaluation.corrected}
            </p>
          )}

          {evaluation.errors.length > 0 && (
            <ol className="mt-6 flex flex-col gap-3 border-t border-paper-ink/15 pt-4">
              {evaluation.errors.map((error, i) => (
                <li key={i} className="grid grid-cols-[1.5rem_1fr] gap-x-2 text-sm">
                  <span className="hand text-2xl leading-none text-red">{i + 1}</span>
                  <ErrorNote t={t} error={error} final={final} />
                </li>
              ))}
            </ol>
          )}

          <TargetWords t={t} checks={evaluation.targetWords} mastery={result.mastery} />

          {evaluation.grammarGoalMet !== null && (
            <p className="mt-4 text-sm">
              <span className="label mr-2">{t.sentence.grammarGoal}</span>
              <span className={evaluation.grammarGoalMet ? "text-good" : "text-red"}>
                {evaluation.grammarGoalMet ? t.sentence.goalMet : t.sentence.goalNotMet}
              </span>
              {evaluation.grammarGoalNote && <span className="text-muted-text"> · {evaluation.grammarGoalNote}</span>}
            </p>
          )}
        </div>
      </article>

      {/* A style tip sits apart from the errors, never as one. */}
      {final && evaluation.suggestion && (
        <aside className="border-l-2 border-rule pl-4">
          <p className="label">{t.sentence.suggestion}</p>
          <p lang="de" className="mt-1 text-lg italic">
            {evaluation.suggestion}
          </p>
          <p className="mt-1 text-xs text-muted-text">{t.sentence.suggestionNote}</p>
        </aside>
      )}

      {showActions && (
        <div className="flex flex-col gap-3">
          {canRetry && <p className="text-sm text-muted-text">{t.sentence.tryAgainHint}</p>}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {canRetry ? (
              <>
                <button onClick={onTryAgain} className="btn">
                  {t.sentence.tryAgain}
                </button>
                <button onClick={onReveal} className="link text-sm">
                  {t.sentence.showCorrection}
                </button>
              </>
            ) : (
              <button onClick={onNext} disabled={loadingNext} className="btn">
                {loadingNext ? t.common.loading : t.sentence.newTask}
              </button>
            )}
          </div>
          {problem && (
            <p role="alert" className="border-l-2 border-red pl-4 text-sm">
              {problem}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The learner's sentence in handwriting on ruled lines. Each error is
 * underlined in red pen and numbered; tapping it opens the note. Once the
 * correction may be shown, the wrong part is struck through and the right
 * form is written above it.
 */
function MarkedSentence({
  t,
  sentence,
  errors,
  final,
}: {
  t: Dictionary;
  sentence: string;
  errors: SentenceError[];
  final: boolean;
}) {
  const segments = segmentSentence(
    sentence,
    errors.map((e) => (e.located ? e.fragment : null))
  );
  return (
    <div className="clear-both mt-4">
      <p
        lang="de"
        className="ruled hand text-[1.75rem] text-pen sm:text-3xl"
        style={{ ["--line-h" as string]: "56px", paddingTop: "8px" }}
      >
        {segments.map((segment, i) => {
          if (segment.errorIndex === null) return <span key={i}>{segment.text}</span>;
          const error = errors[segment.errorIndex];
          return (
            <Popover key={i}>
              <PopoverTrigger
                openOnHover
                delay={100}
                className="relative inline-block cursor-help rounded-[3px] text-left"
              >
                <span className={final && error.correction ? "pen-strike" : "pen-underline"}>{segment.text}</span>
                <sup className="hand ml-0.5 text-lg text-red">{segment.errorIndex + 1}</sup>
                {final && error.correction && (
                  <span
                    aria-hidden
                    className="pen-write absolute -top-6 left-0 -rotate-2 whitespace-nowrap text-2xl font-bold text-red"
                  >
                    {error.correction}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] border border-[#d8cfbd] bg-paper text-paper-ink">
                <ErrorNote t={t} error={error} final={final} />
              </PopoverContent>
            </Popover>
          );
        })}
      </p>
      {!final && errors.some((e) => e.located) && <p className="label mt-2">{t.sentence.tapHint}</p>}
    </div>
  );
}

function ErrorNote({ t, error, final }: { t: Dictionary; error: SentenceError; final: boolean }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-mono text-[11px] text-red">{t.errorTypes[error.type]}</span>
      {!error.located && (
        <span lang="de" className="font-semibold">
          „{error.fragment}“
        </span>
      )}
      <p>{error.explanation}</p>
      {error.rule && (
        <p className="text-muted-text">
          {t.sentence.rule}: {error.rule}
        </p>
      )}
      {final && error.correction && (
        <p>
          {t.sentence.correction}:{" "}
          <span lang="de" className="hand text-xl font-bold text-red">
            {error.correction}
          </span>
        </p>
      )}
    </div>
  );
}

/** A tick or a cross, drawn with the pen. */
function PenMark({ ok }: { ok: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("h-5 w-5 shrink-0", ok ? "text-good" : "text-red")}>
      <path
        d={ok ? "M4 13 L10 19 L21 5" : "M5 5 L19 19 M19 5 L5 19"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="pen-path"
      />
    </svg>
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
    <div className="mt-5 border-t border-paper-ink/15 pt-4">
      <p className="label mb-2">{t.sentence.wordCheck}</p>
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
              <PenMark ok={ok} />
              <span>
                <span lang="de" className="font-display text-base font-bold">
                  {c.term}
                </span>
                <span className={ok ? "text-good" : "text-red"}> {status}</span>
                {c.note && <span className="text-muted-text"> · {c.note}</span>}
                {change && (
                  <span className="ml-2 font-mono text-xs text-muted-text">
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
