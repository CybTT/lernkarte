"use server";

import { createClient } from "@/lib/supabase/server";
import { recordReview, type RecordedReview } from "@/lib/reviews";
import type { QuestionType } from "@/lib/types";

export interface SubmitAnswerInput {
  wordId: string;
  questionType: QuestionType;
  correct: boolean;
  responseMs: number;
}

export type SubmitAnswerResult = RecordedReview;

export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) throw new Error("Unauthorized");

  return recordReview(
    supabase,
    userId,
    input.wordId,
    input.questionType,
    input.correct,
    input.responseMs
  );
}
