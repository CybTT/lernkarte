import type { SupabaseClient } from "@supabase/supabase-js";
import { applyReview } from "./engine";
import type { QuestionType, Word } from "./types";

export interface RecordedReview {
  word: Word;
  masteryBefore: number;
  masteryAfter: number;
}

/**
 * Applies one answer to a word's learning state (mastery, next review date,
 * leech flag) and logs it in `reviews`. Used by every study mode, so a word
 * answered correctly grows stronger and a missed word comes back sooner.
 */
export async function recordReview(
  supabase: SupabaseClient,
  userId: string,
  wordId: string,
  questionType: QuestionType,
  correct: boolean,
  responseMs: number | null
): Promise<RecordedReview> {
  const [{ data: word, error: wordError }, { data: priorReviews }] = await Promise.all([
    supabase.from("words").select("*").eq("id", wordId).eq("user_id", userId).single(),
    supabase
      .from("reviews")
      .select("correct")
      .eq("word_id", wordId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(2),
  ]);
  if (wordError || !word) throw new Error("Word not found");

  const update = applyReview(word as Word, {
    questionType,
    correct,
    responseMs,
    now: new Date(),
    priorResults: (priorReviews ?? []).map((r) => r.correct),
  });

  const [{ data: updatedWord, error: updateError }] = await Promise.all([
    supabase
      .from("words")
      .update({
        mastery: update.mastery_after,
        ease: update.ease,
        interval_days: update.interval_days,
        next_review: update.next_review.toISOString(),
        last_reviewed: update.last_reviewed.toISOString(),
        is_leech: update.is_leech,
      })
      .eq("id", wordId)
      .select("*")
      .single(),
    supabase.from("reviews").insert({
      word_id: wordId,
      user_id: userId,
      question_type: questionType,
      correct,
      response_ms: responseMs,
      mastery_before: update.mastery_before,
      mastery_after: update.mastery_after,
    }),
  ]);
  if (updateError || !updatedWord) throw new Error("Failed to update word");

  return {
    word: updatedWord as Word,
    masteryBefore: update.mastery_before,
    masteryAfter: update.mastery_after,
  };
}
