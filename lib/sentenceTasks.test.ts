import { describe, expect, it } from "vitest";
import { GRAMMAR_GOALS, pickPrompt, pickWords, wordCountFor } from "./sentenceTasks";
import type { Word } from "./types";

const NOW = new Date("2026-11-24T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

function word(id: string, over: Partial<Word> = {}): Word {
  return {
    id,
    user_id: "u",
    created_at: daysAgo(60),
    term: `Wort${id}`,
    source: "manual",
    context_sentence: null,
    original_input: null,
    needs_review: false,
    enriched: true,
    article: null,
    plural: null,
    part_of_speech: "noun",
    meaning_tr: "anlam",
    meaning_en: null,
    meanings_tr: null,
    usage_note: null,
    ipa: null,
    example_de: null,
    example_tr: null,
    praeteritum: null,
    perfekt: null,
    separable: null,
    rektion: null,
    word_family: null,
    theme: null,
    mastery: 70,
    ease: 2.5,
    interval_days: 5,
    next_review: daysAgo(-5), // not due
    last_reviewed: daysAgo(5),
    is_leech: false,
    ...over,
  };
}

const fixedRng = () => 0.5;

describe("wordCountFor", () => {
  it("starts with one word", () => {
    expect(wordCountFor([])).toBe(1);
    expect(wordCountFor(["correct", "minor"])).toBe(1);
  });

  it("grows to two after three good sentences and three after six", () => {
    expect(wordCountFor(["correct", "minor", "correct"])).toBe(2);
    expect(wordCountFor(Array(6).fill("correct"))).toBe(3);
  });

  it("drops back to one after a serious error", () => {
    expect(wordCountFor(["major", "correct", "correct", "correct", "correct"])).toBe(1);
    expect(wordCountFor(["correct", "major", "correct", "correct"])).toBe(1);
  });
});

describe("pickWords", () => {
  it("prefers due words, most overdue first", () => {
    const words = [
      word("a"),
      word("due-recent", { next_review: daysAgo(1) }),
      word("due-old", { next_review: daysAgo(10) }),
    ];
    const ids = pickWords(words, 2, { now: NOW, rng: fixedRng }).map((w) => w.id);
    expect(ids).toEqual(["due-old", "due-recent"]);
  });

  it("then recently learned words before older ones", () => {
    const words = [word("old"), word("new", { created_at: daysAgo(3) })];
    expect(pickWords(words, 1, { now: NOW, rng: fixedRng })[0].id).toBe("new");
  });

  it("uses never-studied words only as a last resort", () => {
    const words = [word("unseen", { last_reviewed: null }), word("seen")];
    expect(pickWords(words, 1, { now: NOW, rng: fixedRng })[0].id).toBe("seen");
    expect(pickWords([word("unseen", { last_reviewed: null })], 1, { now: NOW })[0].id).toBe("unseen");
  });

  it("skips words without a known meaning", () => {
    const words = [
      word("raw", { enriched: false }),
      word("flagged", { needs_review: true }),
      word("ok"),
    ];
    expect(pickWords(words, 3, { now: NOW, rng: fixedRng }).map((w) => w.id)).toEqual(["ok"]);
  });

  it("avoids the previous task's words when it can", () => {
    const words = [word("a", { next_review: daysAgo(9) }), word("b")];
    expect(pickWords(words, 1, { now: NOW, rng: fixedRng, avoidIds: ["a"] })[0].id).toBe("b");
    // ...but not at the cost of an empty task.
    expect(pickWords([word("a")], 1, { now: NOW, avoidIds: ["a"] })[0].id).toBe("a");
  });
});

describe("pickPrompt", () => {
  it("never gives a grammar goal above the learner's level", () => {
    const a1 = GRAMMAR_GOALS.filter((g) => g.level === "A1").map((g) => g.name);
    for (let i = 0; i < 200; i++) {
      const { grammarGoal } = pickPrompt("A1", "tr");
      if (grammarGoal) expect(a1).toContain(grammarGoal.name);
    }
  });

  it("writes the situation in the interface language", () => {
    const rng = () => 0.99; // last situation, no grammar goal
    expect(pickPrompt("B1", "en", rng)).toEqual({
      context: "Explain to a friend why you are late.",
      grammarGoal: null,
    });
  });
});
