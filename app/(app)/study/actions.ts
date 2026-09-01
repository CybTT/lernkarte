"use server";

import { createClient } from "@/lib/supabase/server";
import { applyReview } from "@/lib/engine";
import type { QuestionType, Word } from "@/lib/types";

export interface SubmitAnswerInput {
  wordId: string;
  questionType: QuestionType;
  correct: boolean;
  responseMs: number;
}

export interface SubmitAnswerResult {
  word: Word;
  masteryBefore: number;
  masteryAfter: number;
}

export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: word, error: wordError } = await supabase
    .from("words")
    .select("*")
    .eq("id", input.wordId)
    .eq("user_id", user.id)
    .single();
  if (wordError || !word) throw new Error("Word not found");

  const { data: priorReviews } = await supabase
    .from("reviews")
    .select("correct")
    .eq("word_id", input.wordId)
    .order("created_at", { ascending: false })
    .limit(2);

  const update = applyReview(word as Word, {
    questionType: input.questionType,
    correct: input.correct,
    responseMs: input.responseMs,
    now: new Date(),
    priorResults: (priorReviews ?? []).map((r) => r.correct),
  });

  const { data: updatedWord, error: updateError } = await supabase
    .from("words")
    .update({
      mastery: update.mastery_after,
      ease: update.ease,
      interval_days: update.interval_days,
      next_review: update.next_review.toISOString(),
      last_reviewed: update.last_reviewed.toISOString(),
      is_leech: update.is_leech,
    })
    .eq("id", input.wordId)
    .select("*")
    .single();
  if (updateError || !updatedWord) throw new Error("Failed to update word");

  await supabase.from("reviews").insert({
    word_id: input.wordId,
    user_id: user.id,
    question_type: input.questionType,
    correct: input.correct,
    response_ms: input.responseMs,
    mastery_before: update.mastery_before,
    mastery_after: update.mastery_after,
  });

  return {
    word: updatedWord as Word,
    masteryBefore: update.mastery_before,
    masteryAfter: update.mastery_after,
  };
}
