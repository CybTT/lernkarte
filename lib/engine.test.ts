import { describe, expect, it } from "vitest";
import {
  applyCorrectMastery,
  applyReview,
  applySrs,
  applyWrongMastery,
  BASE_GAIN,
  buildStudySession,
  computeIsLeech,
  MAX_INTERVAL_DAYS,
  QUESTION_WEIGHTS,
  selectQuestionType,
  SLOW_PENALTY_MULTIPLIER,
  SLOW_THRESHOLD_MS,
} from "./engine";
import type { Word } from "./types";

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: "w1",
    user_id: "u1",
    created_at: new Date().toISOString(),
    term: "Haus",
    source: "manual",
    context_sentence: null,
    enriched: true,
    article: "das",
    plural: "Häuser",
    part_of_speech: "noun",
    meaning_tr: "ev",
    meaning_en: "house",
    ipa: "haʊs",
    example_de: "Das ist mein Haus.",
    example_tr: "Bu benim evim.",
    praeteritum: null,
    perfekt: null,
    separable: null,
    rektion: null,
    word_family: null,
    theme: "Wohnen",
    mastery: 0,
    ease: 2.5,
    interval_days: 0,
    next_review: new Date().toISOString(),
    last_reviewed: null,
    is_leech: false,
    ...overrides,
  };
}

describe("mastery scoring", () => {
  it("gains more from harder question types", () => {
    const matchGain = applyCorrectMastery(0, "match") - 0;
    const clozeGain = applyCorrectMastery(0, "cloze") - 0;
    const typingGain = applyCorrectMastery(0, "typing") - 0;
    const translateGain = applyCorrectMastery(0, "translate") - 0;
    expect(matchGain).toBeCloseTo(BASE_GAIN * QUESTION_WEIGHTS.match);
    expect(clozeGain).toBeGreaterThan(matchGain);
    expect(typingGain).toBeGreaterThan(clozeGain);
    expect(translateGain).toBeGreaterThan(typingGain);
  });

  it("has diminishing returns as mastery approaches 100", () => {
    const lowGain = applyCorrectMastery(10, "typing") - 10;
    const highGain = applyCorrectMastery(90, "typing") - 90;
    expect(highGain).toBeLessThan(lowGain);
  });

  it("never exceeds 100", () => {
    expect(applyCorrectMastery(99, "translate")).toBeLessThanOrEqual(100);
    expect(applyCorrectMastery(100, "translate")).toBe(100);
  });

  it("applies a slow-response penalty on correct answers", () => {
    const normal = applyCorrectMastery(50, "typing", 1000) - 50;
    const slow = applyCorrectMastery(50, "typing", SLOW_THRESHOLD_MS + 1) - 50;
    expect(slow).toBeCloseTo(normal * SLOW_PENALTY_MULTIPLIER, 5);
  });

  it("decays mastery by 0.6x on a wrong answer", () => {
    expect(applyWrongMastery(50)).toBeCloseTo(30);
    expect(applyWrongMastery(0)).toBe(0);
  });

  it("never goes below 0", () => {
    expect(applyWrongMastery(0)).toBe(0);
  });
});

describe("SRS scheduling", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("resets interval and lowers ease on a wrong answer", () => {
    const result = applySrs({ ease: 2.5, interval_days: 6 }, false, now);
    expect(result.interval_days).toBe(0);
    expect(result.ease).toBeCloseTo(2.3);
    expect(result.next_review.getTime()).toBe(now.getTime());
  });

  it("floors ease at 1.3", () => {
    const result = applySrs({ ease: 1.35, interval_days: 3 }, false, now);
    expect(result.ease).toBeCloseTo(1.3);
  });

  it("grows interval by ease factor on correct answers", () => {
    const first = applySrs({ ease: 2.5, interval_days: 0 }, true, now);
    expect(first.interval_days).toBe(1);

    const second = applySrs({ ease: first.ease, interval_days: first.interval_days }, true, now);
    expect(second.interval_days).toBe(Math.round(1 * first.ease));
  });

  it("caps interval at 180 days", () => {
    const result = applySrs({ ease: 3.0, interval_days: 170 }, true, now);
    expect(result.interval_days).toBeLessThanOrEqual(MAX_INTERVAL_DAYS);
  });

  it("caps ease at 3.0", () => {
    const result = applySrs({ ease: 2.99, interval_days: 10 }, true, now);
    expect(result.ease).toBeLessThanOrEqual(3.0);
  });
});

describe("leech detection", () => {
  it("flags a word below the mastery floor", () => {
    expect(computeIsLeech(30, [true, true, true])).toBe(true);
  });

  it("flags a word with 2+ wrong of its last 3 reviews", () => {
    expect(computeIsLeech(50, [false, false, true])).toBe(true);
    expect(computeIsLeech(50, [false, true, true])).toBe(false);
  });

  it("clears once mastery reaches 60", () => {
    expect(computeIsLeech(60, [false, false, false])).toBe(false);
    expect(computeIsLeech(59, [false, false, false])).toBe(true);
  });

  it("only looks at the most recent 3 reviews", () => {
    expect(computeIsLeech(50, [true, true, false, false, false])).toBe(false);
  });
});

describe("question-type selection", () => {
  const noRandomDrift = () => 0.99; // never triggers the ±1 band drift

  it("picks recognition types below mastery 20", () => {
    const type = selectQuestionType(10, noRandomDrift);
    expect(["match", "multiple_choice"]).toContain(type);
  });

  it("picks cloze between 20 and 50", () => {
    expect(selectQuestionType(35, noRandomDrift)).toBe("cloze");
  });

  it("picks typing between 50 and 80", () => {
    expect(selectQuestionType(65, noRandomDrift)).toBe("typing");
  });

  it("picks translate at 80+", () => {
    expect(selectQuestionType(95, noRandomDrift)).toBe("translate");
  });

  it("can drift ±1 band when the roll lands under 20%", () => {
    // rng sequence: 0.01 triggers drift, 0.9 picks +1 direction
    const rng = (() => {
      const values = [0.01, 0.9];
      let i = 0;
      return () => values[i++ % values.length];
    })();
    const type = selectQuestionType(35, rng); // base band = cloze(1), drift -> typing(2)
    expect(type).toBe("typing");
  });
});

describe("applyReview", () => {
  it("combines mastery, SRS, and leech updates for a correct answer", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const update = applyReview(
      { mastery: 10, ease: 2.5, interval_days: 0 },
      { questionType: "cloze", correct: true, responseMs: 2000, now, priorResults: [false, false] }
    );
    expect(update.mastery_after).toBeGreaterThan(update.mastery_before);
    expect(update.interval_days).toBe(1);
    expect(update.is_leech).toBe(true); // mastery still under 40
  });

  it("clears leech flag once mastery crosses 60 on a correct streak", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const update = applyReview(
      { mastery: 55, ease: 2.5, interval_days: 4 },
      { questionType: "translate", correct: true, responseMs: 1000, now, priorResults: [true, true] }
    );
    expect(update.mastery_after).toBeGreaterThanOrEqual(60);
    expect(update.is_leech).toBe(false);
  });
});

describe("buildStudySession", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("prioritizes leeches first", () => {
    const words = [
      makeWord({ id: "a", mastery: 50, is_leech: false, next_review: now.toISOString() }),
      makeWord({ id: "b", mastery: 30, is_leech: true, next_review: now.toISOString() }),
    ];
    const session = buildStudySession(words, 10);
    expect(session[0].word.id).toBe("b");
  });

  it("caps picks at dailyGoal", () => {
    const words = Array.from({ length: 30 }, (_, i) =>
      makeWord({ id: `w${i}`, mastery: 10, next_review: now.toISOString() })
    );
    const session = buildStudySession(words, 5);
    expect(session).toHaveLength(5);
  });

  it("tops up with mastered bonus words when the learning pool is short", () => {
    const words = [
      makeWord({ id: "a", mastery: 10, next_review: now.toISOString() }),
      makeWord({ id: "b", mastery: 90, next_review: now.toISOString() }),
      makeWord({ id: "c", mastery: 92, next_review: now.toISOString() }),
    ];
    const session = buildStudySession(words, 3);
    expect(session).toHaveLength(3);
    expect(session.some((s) => s.word.id === "b")).toBe(true);
  });

  it("attaches a question type to every item", () => {
    const words = [makeWord({ mastery: 45, next_review: now.toISOString() })];
    const session = buildStudySession(words, 1);
    expect(session[0].question_type).toBeDefined();
  });
});
