import type { QuestionType, StudyMode, StudySessionItem } from "./types";

/** Non-adaptive modes lock every card to a single question type. */
export const MODE_QUESTION_TYPE: Record<Exclude<StudyMode, "smart">, QuestionType> = {
  flashcard: "flashcard",
  typing: "typing",
  translate: "translate",
};

export function parseMode(value: string | undefined | null): StudyMode {
  if (value === "flashcard" || value === "typing" || value === "translate") return value;
  return "smart";
}

/**
 * Applies the selected mode to an already-built session. Word selection (due
 * pool, leech priority, mastered top-up) is identical in every mode — only the
 * question type changes.
 *
 * A word we haven't enriched yet has no meaning to quiz against, so
 * self-assessment (flashcard) is the only honest question type for it.
 */
export function applyMode(session: StudySessionItem[], mode: StudyMode): StudySessionItem[] {
  return session.map((item) => {
    const question_type =
      mode === "smart" ? item.question_type : MODE_QUESTION_TYPE[mode];

    if (!item.word.enriched || !item.word.meaning_tr) {
      return { ...item, question_type: "flashcard" as const };
    }
    return question_type === item.question_type ? item : { ...item, question_type };
  });
}
