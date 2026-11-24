/** A piece of the learner's sentence; `errorIndex` points at the error it belongs to. */
export interface Segment {
  text: string;
  errorIndex: number | null;
}

/**
 * Splits a sentence into plain and erroneous pieces so the errors can be
 * coloured in place. Each fragment claims its first case-insensitive match
 * that doesn't overlap one already claimed; fragments that can't be found
 * (null, or not in the sentence) are simply not highlighted.
 */
export function segmentSentence(sentence: string, fragments: (string | null)[]): Segment[] {
  const lower = sentence.toLowerCase();
  const claimed: { start: number; end: number; errorIndex: number }[] = [];

  fragments.forEach((fragment, errorIndex) => {
    if (!fragment) return;
    const needle = fragment.toLowerCase();
    let from = 0;
    while (from <= lower.length) {
      const start = lower.indexOf(needle, from);
      if (start === -1) return;
      const end = start + needle.length;
      if (!claimed.some((c) => start < c.end && c.start < end)) {
        claimed.push({ start, end, errorIndex });
        return;
      }
      from = start + 1;
    }
  });

  claimed.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const c of claimed) {
    if (c.start > cursor) segments.push({ text: sentence.slice(cursor, c.start), errorIndex: null });
    segments.push({ text: sentence.slice(c.start, c.end), errorIndex: c.errorIndex });
    cursor = c.end;
  }
  if (cursor < sentence.length) segments.push({ text: sentence.slice(cursor), errorIndex: null });
  return segments;
}
