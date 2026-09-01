/** Accent/ß-tolerant comparison for typed German answers. */
export function normalizeGerman(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/g, "");
}

export function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeGerman(userAnswer) === normalizeGerman(correctAnswer);
}

/** Blanks the first case-insensitive occurrence of `term` inside `sentence`. */
export function makeCloze(sentence: string, term: string): { prompt: string; found: boolean } {
  const idx = sentence.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return { prompt: sentence, found: false };
  return {
    prompt: sentence.slice(0, idx) + "____" + sentence.slice(idx + term.length),
    found: true,
  };
}
