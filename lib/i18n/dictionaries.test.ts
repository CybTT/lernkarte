import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";
import { getDictionary } from "./index";
import { fmt, fmtParts } from "./format";

/** Flattens a dictionary into "a.b.c" -> text. */
function flatten(obj: object, prefix = ""): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value as object, path) };
  }, {});
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("interface dictionaries", () => {
  const turkish = flatten(getDictionary("tr"));

  it.each(LOCALES)("%s has every text, with the same {placeholders} as Turkish", (locale) => {
    const other = flatten(getDictionary(locale));
    expect(Object.keys(other).sort()).toEqual(Object.keys(turkish).sort());
    for (const [key, text] of Object.entries(turkish)) {
      expect(placeholders(other[key]), `${locale}: ${key}`).toEqual(placeholders(text));
      expect(other[key].trim(), `${locale}: ${key}`).not.toBe("");
    }
  });
});

describe("fmt", () => {
  it("fills placeholders and leaves unknown ones alone", () => {
    expect(fmt("{n} words, {x}", { n: 3 })).toBe("3 words, {x}");
  });

  it("can fill placeholders with non-string parts", () => {
    expect(fmtParts("You got {correct} of {total}", { correct: 7, total: 9 })).toEqual([
      "You got ",
      7,
      " of ",
      9,
    ]);
  });
});
