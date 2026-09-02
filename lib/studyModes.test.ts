import { describe, expect, it } from "vitest";
import { applyMode, MODE_QUESTION_TYPE, parseMode } from "./studyModes";
import type { QuestionType, StudySessionItem, Word } from "./types";

function item(question_type: QuestionType, wordOverrides: Partial<Word> = {}): StudySessionItem {
  return {
    question_type,
    word: {
      id: "w1",
      user_id: "u1",
      created_at: "",
      term: "Haus",
      source: "manual",
      context_sentence: null,
      original_input: null,
      needs_review: false,
      enriched: true,
      article: "das",
      plural: "Häuser",
      part_of_speech: "noun",
      meaning_tr: "ev",
      meaning_en: "house",
      meanings_tr: null,
      usage_note: null,
      ipa: "haʊs",
      example_de: "Das ist mein Haus.",
      example_tr: "Bu benim evim.",
      praeteritum: null,
      perfekt: null,
      separable: null,
      rektion: null,
      word_family: null,
      theme: "Wohnen",
      mastery: 10,
      ease: 2.5,
      interval_days: 0,
      next_review: "",
      last_reviewed: null,
      is_leech: false,
      ...wordOverrides,
    },
  };
}

describe("parseMode", () => {
  it("accepts the three fixed modes", () => {
    expect(parseMode("flashcard")).toBe("flashcard");
    expect(parseMode("typing")).toBe("typing");
    expect(parseMode("translate")).toBe("translate");
  });

  it("falls back to smart for anything else", () => {
    expect(parseMode("smart")).toBe("smart");
    expect(parseMode(undefined)).toBe("smart");
    expect(parseMode(null)).toBe("smart");
    expect(parseMode("nonsense")).toBe("smart");
  });
});

describe("applyMode", () => {
  it("leaves the adaptive engine's choices alone in smart mode", () => {
    const session = [item("multiple_choice"), item("cloze"), item("translate")];
    const result = applyMode(session, "smart");
    expect(result.map((i) => i.question_type)).toEqual(["multiple_choice", "cloze", "translate"]);
  });

  it.each(["flashcard", "typing", "translate"] as const)(
    "locks every card to one type in %s mode",
    (mode) => {
      const session = [item("multiple_choice"), item("cloze"), item("typing")];
      const result = applyMode(session, mode);
      expect(result.every((i) => i.question_type === MODE_QUESTION_TYPE[mode])).toBe(true);
    }
  );

  it("downgrades unenriched words to flashcard in every mode", () => {
    const unenriched = item("multiple_choice", { enriched: false, meaning_tr: null });
    for (const mode of ["smart", "flashcard", "typing", "translate"] as const) {
      const [result] = applyMode([unenriched], mode);
      expect(result.question_type).toBe("flashcard");
    }
  });

  it("downgrades enriched-but-meaningless words too", () => {
    const noMeaning = item("typing", { enriched: true, meaning_tr: null });
    expect(applyMode([noMeaning], "typing")[0].question_type).toBe("flashcard");
  });

  it("does not mutate the input session", () => {
    const session = [item("multiple_choice")];
    applyMode(session, "typing");
    expect(session[0].question_type).toBe("multiple_choice");
  });

  it("keeps word selection untouched — same words, same order", () => {
    const session = [item("cloze", { id: "a" }), item("typing", { id: "b" })];
    const result = applyMode(session, "flashcard");
    expect(result.map((i) => i.word.id)).toEqual(["a", "b"]);
  });
});
