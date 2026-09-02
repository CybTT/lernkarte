import type { Article, PartOfSpeech } from "./types";

/**
 * Guards the `term` column. Enrichment is instructed to return a single clean
 * German lemma, but the model occasionally "helpfully" answers with an
 * explanation instead ("(Bu kelime Türkçedir: araba = otomobil…)"). A word like
 * that breaks both the dictionary and the quiz, so nothing reaches the column
 * without passing through here.
 */

/** German letters plus the hyphen that real compounds use ("E-Mail", "ec-Karte"). */
const TERM_PATTERN = /^[A-Za-zÄÖÜäöüß]+(-[A-Za-zÄÖÜäöüß]+)*$/;
const MAX_TERM_LENGTH = 40;

export function isCleanGermanTerm(term: string): boolean {
  const trimmed = term.trim();
  if (!trimmed || trimmed.length > MAX_TERM_LENGTH) return false;
  return TERM_PATTERN.test(trimmed);
}

/** Strips a leading article the model or user may have included ("das Auto" -> "Auto"). */
export function stripArticle(term: string): { term: string; article: Article | null } {
  const match = term.trim().match(/^(der|die|das)\s+(.+)$/i);
  if (!match) return { term: term.trim(), article: null };
  return {
    term: match[2].trim(),
    article: match[1].toLowerCase() as Article,
  };
}

/** German nouns are capitalised; everything else stays lowercase as written. */
export function applyGermanCasing(
  term: string,
  partOfSpeech: PartOfSpeech | null,
  article: Article | null
): string {
  if (!term) return term;
  const isNoun = partOfSpeech === "noun" || article !== null;
  if (!isNoun) return term;
  return term[0].toLocaleUpperCase("de-DE") + term.slice(1);
}

export interface NormalizedTerm {
  term: string;
  article: Article | null;
}

/**
 * Returns a storable term, or null when the candidate isn't a usable German
 * word. `article` is returned so a leading article found in the input can be
 * used when enrichment didn't supply one.
 */
export function normalizeTerm(
  candidate: string,
  partOfSpeech: PartOfSpeech | null = null,
  article: Article | null = null
): NormalizedTerm | null {
  const stripped = stripArticle(candidate ?? "");
  const resolvedArticle = article ?? stripped.article;
  if (!isCleanGermanTerm(stripped.term)) return null;
  return {
    term: applyGermanCasing(stripped.term, partOfSpeech, resolvedArticle),
    article: resolvedArticle,
  };
}
