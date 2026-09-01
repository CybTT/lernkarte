import type { QuestionType, Word } from "./types";

// ============================================================
// Tunables
// ============================================================
export const BASE_GAIN = 12;
export const SLOW_THRESHOLD_MS = 8000;
export const SLOW_PENALTY_MULTIPLIER = 0.6;
export const WRONG_MASTERY_MULTIPLIER = 0.6;
export const LEARNED_MASTERY_THRESHOLD = 85;
export const LEECH_MASTERY_THRESHOLD = 40;
export const LEECH_CLEAR_THRESHOLD = 60;
export const MAX_INTERVAL_DAYS = 180;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const WRONG_EASE_PENALTY = 0.2;
export const CORRECT_EASE_GAIN = 0.05;

export const QUESTION_WEIGHTS: Record<QuestionType, number> = {
  match: 0.5,
  multiple_choice: 0.5,
  cloze: 1.0,
  typing: 1.5,
  translate: 2.0,
};

// ============================================================
// 4.1 Mastery scoring
// ============================================================

/** Mastery gained from a single correct answer, before clamping. */
export function computeGain(
  mastery: number,
  questionType: QuestionType,
  responseMs?: number | null
): number {
  const weight = QUESTION_WEIGHTS[questionType];
  let gain = BASE_GAIN * weight * (1 - mastery / 100);
  if (responseMs != null && responseMs > SLOW_THRESHOLD_MS) {
    gain *= SLOW_PENALTY_MULTIPLIER;
  }
  return gain;
}

export function applyCorrectMastery(
  mastery: number,
  questionType: QuestionType,
  responseMs?: number | null
): number {
  const gain = computeGain(mastery, questionType, responseMs);
  return Math.min(100, mastery + gain);
}

export function applyWrongMastery(mastery: number): number {
  return Math.max(0, mastery * WRONG_MASTERY_MULTIPLIER);
}

// ============================================================
// 4.2 SRS scheduling (SM-2 inspired, mastery-aware)
// ============================================================

export interface SrsState {
  ease: number;
  interval_days: number;
}

export interface SrsResult {
  ease: number;
  interval_days: number;
  next_review: Date;
}

export function applySrs(state: SrsState, correct: boolean, now: Date): SrsResult {
  let { ease, interval_days } = state;

  if (!correct) {
    interval_days = 0;
    ease = Math.max(MIN_EASE, ease - WRONG_EASE_PENALTY);
  } else {
    ease = Math.min(MAX_EASE, ease + CORRECT_EASE_GAIN);
    if (interval_days === 0) {
      interval_days = 1;
    } else {
      interval_days = Math.round(interval_days * ease);
    }
    interval_days = Math.min(interval_days, MAX_INTERVAL_DAYS);
  }

  const next_review = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);
  return { ease, interval_days, next_review };
}

// ============================================================
// 4.3 Leech detection
// ============================================================

/**
 * `lastResults` should be the outcomes (correct/wrong) of the most recent
 * reviews for this word, newest first, INCLUDING the review just answered.
 * Only the first three entries are considered.
 */
export function computeIsLeech(mastery: number, lastResults: boolean[]): boolean {
  if (mastery >= LEECH_CLEAR_THRESHOLD) return false;
  if (mastery < LEECH_MASTERY_THRESHOLD) return true;

  const lastThree = lastResults.slice(0, 3);
  const wrongCount = lastThree.filter((correct) => !correct).length;
  return wrongCount >= 2;
}

// ============================================================
// 4.4 Question-type selection
// ============================================================

const BANDS: QuestionType[][] = [
  ["match", "multiple_choice"], // 0: mastery < 20 — recognition
  ["cloze"], // 1: 20 <= m < 50 — recall in context
  ["typing"], // 2: 50 <= m < 80 — active production
  ["translate"], // 3: m >= 80 — free production
];

function bandForMastery(mastery: number): number {
  if (mastery < 20) return 0;
  if (mastery < 50) return 1;
  if (mastery < 80) return 2;
  return 3;
}

export function selectQuestionType(mastery: number, rng: () => number = Math.random): QuestionType {
  let band = bandForMastery(mastery);

  // 20% of the time, drift ±1 band so it doesn't feel mechanical.
  if (rng() < 0.2) {
    const direction = rng() < 0.5 ? -1 : 1;
    band = Math.min(BANDS.length - 1, Math.max(0, band + direction));
  }

  const options = BANDS[band];
  if (options.length === 1) return options[0];
  const index = Math.floor(rng() * options.length);
  return options[Math.min(index, options.length - 1)];
}

// ============================================================
// Combined per-review update
// ============================================================

export interface ReviewOutcome {
  questionType: QuestionType;
  correct: boolean;
  responseMs?: number | null;
  now: Date;
  /** Outcomes of prior reviews for this word, newest first (not including this one). */
  priorResults?: boolean[];
}

export interface ReviewUpdate {
  mastery_before: number;
  mastery_after: number;
  ease: number;
  interval_days: number;
  next_review: Date;
  last_reviewed: Date;
  is_leech: boolean;
}

export function applyReview(
  word: Pick<Word, "mastery" | "ease" | "interval_days">,
  outcome: ReviewOutcome
): ReviewUpdate {
  const mastery_before = word.mastery;
  const mastery_after = outcome.correct
    ? applyCorrectMastery(mastery_before, outcome.questionType, outcome.responseMs)
    : applyWrongMastery(mastery_before);

  const srs = applySrs(
    { ease: word.ease, interval_days: word.interval_days },
    outcome.correct,
    outcome.now
  );

  const lastResults = [outcome.correct, ...(outcome.priorResults ?? [])];
  const is_leech = computeIsLeech(mastery_after, lastResults);

  return {
    mastery_before,
    mastery_after,
    ease: srs.ease,
    interval_days: srs.interval_days,
    next_review: srs.next_review,
    last_reviewed: outcome.now,
    is_leech,
  };
}

// ============================================================
// 4.5 Session builder
// ============================================================

import type { StudySessionItem } from "./types";

/**
 * Pure session builder. `candidates` should already be filtered to
 * `next_review <= now` (the caller does the DB query); this function
 * separates the "still learning" pool from "mastered bonus" words,
 * sorts, and attaches a question type to each pick.
 */
export function buildStudySession(
  candidates: Word[],
  dailyGoal: number,
  rng: () => number = Math.random
): StudySessionItem[] {
  const learning = candidates.filter((w) => w.mastery < LEARNED_MASTERY_THRESHOLD);
  const mastered = candidates.filter((w) => w.mastery >= LEARNED_MASTERY_THRESHOLD);

  const sortPool = (pool: Word[]) =>
    [...pool].sort((a, b) => {
      if (a.is_leech !== b.is_leech) return a.is_leech ? -1 : 1;
      const nextReviewDiff = new Date(a.next_review).getTime() - new Date(b.next_review).getTime();
      if (nextReviewDiff !== 0) return nextReviewDiff;
      return a.mastery - b.mastery;
    });

  const picked = sortPool(learning).slice(0, dailyGoal);

  if (picked.length < dailyGoal) {
    const shortfall = dailyGoal - picked.length;
    picked.push(...sortPool(mastered).slice(0, shortfall));
  }

  return picked.map((word) => ({
    word,
    question_type: selectQuestionType(word.mastery, rng),
  }));
}
