import { NextResponse, type NextRequest } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/route";
import { aiUnavailable } from "@/lib/aiResponse";
import { checkSentence, wordUsedCorrectly, type Evaluation } from "@/lib/sentenceCheck";
import { CONTEXTS, GRAMMAR_GOALS, isLevel } from "@/lib/sentenceTasks";
import { recordReview } from "@/lib/reviews";
import { getLocale } from "@/lib/i18n/server";
import type { Word } from "@/lib/types";

const KNOWN_CONTEXTS = new Set(CONTEXTS.flatMap((c) => Object.values(c)));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SENTENCE_LENGTH = 300;

export interface SentenceCheckResponse {
  evaluation: Evaluation;
  /** Mastery change per target word; only on the first try of a task. */
  mastery: { id: string; term: string; before: number; after: number }[];
}

/**
 * Evaluates one sentence for a "Cümle Kur" task. The first try of a task also
 * updates each target word's learning state: used correctly -> stronger,
 * otherwise it comes back for review sooner. A second try is for learning only.
 */
export async function POST(request: NextRequest) {
  const { supabase, user } = await getRouteSupabase(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const taskId: unknown = body?.task_id;
  const attemptNo: unknown = body?.attempt_no;
  const wordIds: unknown = body?.word_ids;
  const context: unknown = body?.context;
  const grammarGoalId: unknown = body?.grammar_goal_id ?? null;
  const sentence = typeof body?.sentence === "string" ? body.sentence.trim() : "";

  const grammarGoal =
    grammarGoalId === null ? null : GRAMMAR_GOALS.find((g) => g.id === grammarGoalId) ?? undefined;
  if (
    typeof taskId !== "string" ||
    !UUID.test(taskId) ||
    (attemptNo !== 1 && attemptNo !== 2) ||
    !Array.isArray(wordIds) ||
    wordIds.length < 1 ||
    wordIds.length > 3 ||
    !wordIds.every((id) => typeof id === "string" && UUID.test(id)) ||
    typeof context !== "string" ||
    !KNOWN_CONTEXTS.has(context) ||
    grammarGoal === undefined ||
    !sentence ||
    sentence.length > MAX_SENTENCE_LENGTH
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [{ data: wordRows }, { data: profile }, locale] = await Promise.all([
    supabase
      .from("words")
      .select("id, term, article, meaning_tr")
      .eq("user_id", user.id)
      .in("id", wordIds as string[]),
    supabase.from("profiles").select("level").eq("id", user.id).single(),
    getLocale(),
  ]);
  // Keep the task's word order; every word must belong to this user.
  const words = (wordIds as string[])
    .map((id) => (wordRows as Pick<Word, "id" | "term" | "article" | "meaning_tr">[] | null)?.find((w) => w.id === id))
    .filter((w): w is Pick<Word, "id" | "term" | "article" | "meaning_tr"> => Boolean(w));
  if (words.length !== wordIds.length) {
    return NextResponse.json({ error: "Unknown word" }, { status: 400 });
  }

  let evaluation: Evaluation;
  try {
    evaluation = await checkSentence({
      sentence,
      targetWords: words.map((w) => ({ term: w.term, article: w.article, meaning: w.meaning_tr })),
      context,
      grammarGoal: grammarGoal?.name ?? null,
      level: isLevel(profile?.level) ? profile.level : "B1",
      locale,
    });
  } catch (err) {
    return aiUnavailable(err, "sentence-check");
  }

  const { error: insertError } = await supabase.from("sentence_attempts").insert({
    user_id: user.id,
    task_id: taskId,
    attempt_no: attemptNo,
    word_ids: words.map((w) => w.id),
    context,
    grammar_goal: grammarGoal?.name ?? null,
    sentence,
    verdict: evaluation.verdict,
    error_types: evaluation.errors.map((e) => e.type),
    feedback: evaluation,
  });
  if (insertError) console.error("sentence_attempts insert failed:", insertError.message);

  const mastery: SentenceCheckResponse["mastery"] = [];
  if (attemptNo === 1) {
    const results = await Promise.allSettled(
      words.map((w, i) =>
        recordReview(
          supabase,
          user.id,
          w.id,
          "sentence",
          wordUsedCorrectly(evaluation.targetWords[i]),
          // Writing a sentence takes time; speed says nothing here.
          null
        )
      )
    );
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        mastery.push({
          id: words[i].id,
          term: words[i].term,
          before: result.value.masteryBefore,
          after: result.value.masteryAfter,
        });
      } else {
        console.error("recordReview failed:", (result.reason as Error)?.message);
      }
    });
  }

  return NextResponse.json({ evaluation, mastery } satisfies SentenceCheckResponse);
}
