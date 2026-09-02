import { describe, expect, it } from "vitest";
import { buildOptions, displayTerm, normalizePos, pickDistractors } from "./distractors";
import type { DictionaryPoolEntry } from "./types";

function entry(
  term: string,
  part_of_speech: DictionaryPoolEntry["part_of_speech"] = "noun",
  overrides: Partial<DictionaryPoolEntry> = {}
): DictionaryPoolEntry {
  return {
    id: `id-${term}`,
    term,
    article: part_of_speech === "noun" ? "der" : null,
    plural_hint: null,
    part_of_speech,
    level: "A1",
    example_de: null,
    ...overrides,
  };
}

// Deterministic "rng" so scoring is testable; returns 0 => no jitter.
const noJitter = () => 0;

describe("normalizePos", () => {
  it("keeps the pool's own buckets", () => {
    expect(normalizePos("noun")).toBe("noun");
    expect(normalizePos("verb")).toBe("verb");
    expect(normalizePos("adjective")).toBe("adjective");
  });

  it("folds adverb, other, and null into 'other'", () => {
    expect(normalizePos("adverb")).toBe("other");
    expect(normalizePos("other")).toBe("other");
    expect(normalizePos(null)).toBe("other");
    expect(normalizePos(undefined)).toBe("other");
  });
});

describe("pickDistractors", () => {
  it("returns the requested number of distractors", () => {
    const pool = [entry("Laden"), entry("Straße"), entry("Land"), entry("Buch"), entry("Stadt")];
    const picks = pickDistractors(pool, { term: "Haus", part_of_speech: "noun" }, 3, noJitter);
    expect(picks).toHaveLength(3);
  });

  it("never includes the target word itself", () => {
    const pool = [entry("Haus"), entry("Laden"), entry("Land"), entry("Buch")];
    const picks = pickDistractors(pool, { term: "Haus", part_of_speech: "noun" }, 3, noJitter);
    expect(picks.map((p) => p.term)).not.toContain("Haus");
  });

  it("matches the target term case-insensitively when excluding it", () => {
    const pool = [entry("haus"), entry("Laden"), entry("Land"), entry("Buch")];
    const picks = pickDistractors(pool, { term: "Haus", part_of_speech: "noun" }, 3, noJitter);
    expect(picks.map((p) => p.term.toLowerCase())).not.toContain("haus");
  });

  it("prefers the same part of speech", () => {
    const pool = [
      entry("gehen", "verb"),
      entry("laufen", "verb"),
      entry("machen", "verb"),
      entry("Haus", "noun"),
      entry("Buch", "noun"),
    ];
    const picks = pickDistractors(pool, { term: "kommen", part_of_speech: "verb" }, 3, noJitter);
    expect(picks.every((p) => p.part_of_speech === "verb")).toBe(true);
  });

  it("falls back to other parts of speech when the same one runs out", () => {
    const pool = [entry("gehen", "verb"), entry("Haus", "noun"), entry("Buch", "noun")];
    const picks = pickDistractors(pool, { term: "kommen", part_of_speech: "verb" }, 3, noJitter);
    expect(picks).toHaveLength(3);
    expect(picks[0].part_of_speech).toBe("verb");
  });

  it("prefers words of similar length", () => {
    const pool = [
      entry("Auto"), // 4 — closest to "Haus" (4)
      entry("Lebensversicherung"), // 18 — far off
      entry("Wissenschaftlerin"), // 17 — far off
      entry("Nachbarschaftshilfe"), // 19 — far off
    ];
    const picks = pickDistractors(pool, { term: "Haus", part_of_speech: "noun" }, 1, noJitter);
    expect(picks[0].term).toBe("Auto");
  });

  it("deduplicates repeated terms in the pool", () => {
    const pool = [entry("Laden"), entry("Laden"), entry("Land"), entry("Buch")];
    const picks = pickDistractors(pool, { term: "Haus", part_of_speech: "noun" }, 3, noJitter);
    const terms = picks.map((p) => p.term);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("returns fewer than requested when the pool is too small", () => {
    const picks = pickDistractors([entry("Laden")], { term: "Haus", part_of_speech: "noun" }, 3, noJitter);
    expect(picks).toHaveLength(1);
  });

  it("handles an empty pool without throwing", () => {
    expect(pickDistractors([], { term: "Haus", part_of_speech: "noun" }, 3, noJitter)).toEqual([]);
  });

  it("treats a null part of speech as 'other'", () => {
    const pool = [entry("ab", "other"), entry("Haus", "noun"), entry("gehen", "verb")];
    const picks = pickDistractors(pool, { term: "aber", part_of_speech: null }, 1, noJitter);
    expect(picks[0].part_of_speech).toBe("other");
  });
});

describe("displayTerm", () => {
  it("capitalises nouns so the user's lowercase entry doesn't stand out", () => {
    expect(displayTerm("haus", true)).toBe("Haus");
    expect(displayTerm("Haus", true)).toBe("Haus");
  });

  it("leaves non-nouns alone", () => {
    expect(displayTerm("gehen", false)).toBe("gehen");
    expect(displayTerm("schnell", false)).toBe("schnell");
  });

  it("handles umlauts and empty input", () => {
    expect(displayTerm("äpfel", true)).toBe("Äpfel");
    expect(displayTerm("", true)).toBe("");
  });
});

describe("buildOptions", () => {
  it("includes the correct answer plus every distractor", () => {
    const options = buildOptions("Haus", [entry("Laden"), entry("Land"), entry("Buch")], noJitter);
    expect(options).toHaveLength(4);
    expect(options).toContain("Haus");
    expect(options).toContain("Laden");
  });

  it("shuffles rather than always putting the answer first", () => {
    // rng = 0.99 pushes the last element into earlier slots
    const options = buildOptions("Haus", [entry("Laden"), entry("Land")], () => 0.99);
    expect(options).toHaveLength(3);
    expect(new Set(options).size).toBe(3);
  });
});
