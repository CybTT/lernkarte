import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));
const { localeFromAcceptLanguage } = await import("./server");

describe("localeFromAcceptLanguage", () => {
  it.each([
    ["tr-TR,tr;q=0.9,en;q=0.8", "tr"],
    ["en-US,en;q=0.9", "en"],
    ["fr-FR,fr;q=0.9,de;q=0.8,en;q=0.5", "de"],
    ["en;q=0.4,de;q=0.9", "de"],
  ])("%s -> %s", (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected);
  });

  it("returns null when nothing fits", () => {
    expect(localeFromAcceptLanguage("fr-FR,es;q=0.5")).toBeNull();
    expect(localeFromAcceptLanguage(null)).toBeNull();
    expect(localeFromAcceptLanguage("en;q=0")).toBeNull();
  });
});
