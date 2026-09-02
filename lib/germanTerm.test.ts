import { describe, expect, it } from "vitest";
import { applyGermanCasing, isCleanGermanTerm, normalizeTerm, stripArticle } from "./germanTerm";

describe("isCleanGermanTerm", () => {
  it("accepts ordinary German words", () => {
    for (const term of ["Haus", "gehen", "schnell", "Äpfel", "Straße", "ankommen"]) {
      expect(isCleanGermanTerm(term)).toBe(true);
    }
  });

  it("accepts hyphenated compounds", () => {
    expect(isCleanGermanTerm("E-Mail")).toBe(true);
    expect(isCleanGermanTerm("ec-Karte")).toBe(true);
  });

  it("rejects the explanations that corrupted rows in production", () => {
    expect(isCleanGermanTerm("kedi (Türkçe kelime — Almanca karşılığı: die Katze)")).toBe(false);
    expect(
      isCleanGermanTerm("(Bu kelime Türkçedir: araba = otomobil. Almanca karşılığı: das Auto)")
    ).toBe(false);
  });

  it("rejects anything with spaces, punctuation, or slashes", () => {
    for (const term of ["das Auto", "Auto/Wagen", "Auto.", "Auto,", "araba = otomobil", ""]) {
      expect(isCleanGermanTerm(term)).toBe(false);
    }
  });

  it("rejects absurdly long input", () => {
    expect(isCleanGermanTerm("a".repeat(41))).toBe(false);
  });

  it("rejects leading or trailing hyphens (suffix fragments)", () => {
    expect(isCleanGermanTerm("-weise")).toBe(false);
    expect(isCleanGermanTerm("gesamt-")).toBe(false);
  });
});

describe("stripArticle", () => {
  it("splits a leading article off", () => {
    expect(stripArticle("das Auto")).toEqual({ term: "Auto", article: "das" });
    expect(stripArticle("DIE Frau")).toEqual({ term: "Frau", article: "die" });
  });

  it("leaves words without an article alone", () => {
    expect(stripArticle("Auto")).toEqual({ term: "Auto", article: null });
    expect(stripArticle("gehen")).toEqual({ term: "gehen", article: null });
  });
});

describe("applyGermanCasing", () => {
  it("capitalises nouns", () => {
    expect(applyGermanCasing("haus", "noun", null)).toBe("Haus");
    expect(applyGermanCasing("auto", null, "das")).toBe("Auto");
  });

  it("leaves verbs and adjectives lowercase", () => {
    expect(applyGermanCasing("gehen", "verb", null)).toBe("gehen");
    expect(applyGermanCasing("schnell", "adjective", null)).toBe("schnell");
  });

  it("handles umlauts", () => {
    expect(applyGermanCasing("äpfel", "noun", null)).toBe("Äpfel");
  });
});

describe("normalizeTerm", () => {
  it("cleans up a lowercase noun", () => {
    expect(normalizeTerm("haus", "noun", "das")).toEqual({ term: "Haus", article: "das" });
  });

  it("takes the article from the input when enrichment gave none", () => {
    expect(normalizeTerm("das Auto", "noun", null)).toEqual({ term: "Auto", article: "das" });
  });

  it("prefers the enrichment's article over one parsed from the input", () => {
    expect(normalizeTerm("der Auto", "noun", "das")).toEqual({ term: "Auto", article: "das" });
  });

  it("returns null for explanations instead of storing them", () => {
    expect(normalizeTerm("kedi (Türkçe kelime — Almanca karşılığı: die Katze)", "noun")).toBeNull();
    expect(normalizeTerm("araba = otomobil", "other")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(normalizeTerm("", "noun")).toBeNull();
    expect(normalizeTerm("   ", "noun")).toBeNull();
  });
});
