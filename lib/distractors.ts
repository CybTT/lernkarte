import type { DictionaryPoolEntry, PartOfSpeech } from "./types";

/**
 * Distractor picking for multiple-choice questions. Pure and local — no AI,
 * no network. Candidates come from the shared `dictionary_pool` table; the
 * caller does the (single, batched) query and hands the rows in here.
 */

/** How much random noise to add to each score, so repeats aren't identical. */
export const SCORE_JITTER = 1.5;

type PoolPos = DictionaryPoolEntry["part_of_speech"];

export interface DistractorTarget {
  term: string;
  part_of_speech: PartOfSpeech | null;
}

/** The pool has no 'adverb' bucket; fold it (and anything unknown) into 'other'. */
export function normalizePos(pos: PartOfSpeech | null | undefined): PoolPos {
  if (pos === "noun" || pos === "verb" || pos === "adjective") return pos;
  return "other";
}

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

/**
 * Ranks candidates by how plausible they are as a wrong answer next to
 * `target`: same part of speech first, then similar length, with a little
 * jitter so the same word doesn't always draw the same three distractors.
 */
export function pickDistractors(
  pool: DictionaryPoolEntry[],
  target: DistractorTarget,
  count = 3,
  rng: () => number = Math.random
): DictionaryPoolEntry[] {
  const targetTerm = normalizeTerm(target.term);
  const targetPos = normalizePos(target.part_of_speech);
  const targetLength = target.term.trim().length;

  const seen = new Set<string>([targetTerm]);
  const candidates: DictionaryPoolEntry[] = [];
  for (const entry of pool) {
    const key = normalizeTerm(entry.term);
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(entry);
  }

  const score = (entry: DictionaryPoolEntry) =>
    -Math.abs(entry.term.trim().length - targetLength) + rng() * SCORE_JITTER;

  const samePos = candidates.filter((c) => c.part_of_speech === targetPos);
  const otherPos = candidates.filter((c) => c.part_of_speech !== targetPos);

  const ranked = [
    ...samePos.map((entry) => ({ entry, score: score(entry) })).sort((a, b) => b.score - a.score),
    // Only used to top up when there aren't enough same-part-of-speech words.
    ...otherPos.map((entry) => ({ entry, score: score(entry) })).sort((a, b) => b.score - a.score),
  ];

  return ranked.slice(0, count).map((r) => r.entry);
}

/**
 * German nouns are capitalised, and every pool word already is. If the user
 * typed their own word in lowercase, leaving it as-is would make the correct
 * option visually obvious next to the distractors — so normalise it.
 */
export function displayTerm(term: string, isNoun: boolean): string {
  if (!isNoun || !term) return term;
  return term[0].toLocaleUpperCase("de-DE") + term.slice(1);
}

/** Correct answer plus distractors, shuffled. Done server-side so the client renders deterministically. */
export function buildOptions(
  correctTerm: string,
  distractors: DictionaryPoolEntry[],
  rng: () => number = Math.random
): string[] {
  const options = [correctTerm, ...distractors.map((d) => d.term)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}
