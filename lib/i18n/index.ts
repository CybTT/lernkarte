import type { Locale } from "./config";
import { de } from "./dictionaries/de";
import { en } from "./dictionaries/en";
import { tr, type Dictionary } from "./dictionaries/tr";

export type { Dictionary };
export { fmt, fmtParts } from "./format";

const DICTIONARIES: Record<Locale, Dictionary> = { tr, en, de };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Locale code for dates and numbers (e.g. toLocaleDateString). */
export const DATE_LOCALE: Record<Locale, string> = { tr: "tr-TR", en: "en-GB", de: "de-DE" };
