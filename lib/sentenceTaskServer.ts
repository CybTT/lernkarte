import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "./i18n/config";
import { pickPrompt, pickWords, toTaskWord, wordCountFor, type SentenceTask, type Verdict } from "./sentenceTasks";
import type { Level, Word } from "./types";

const WORD_COLUMNS =
  "id, term, article, meaning_tr, part_of_speech, enriched, needs_review, last_reviewed, next_review, created_at, mastery";

/**
 * Builds the next "Cümle Kur" task for a learner: how many words (from their
 * recent results), which words, and the situation / grammar goal.
 * Returns null when they have no usable words yet.
 */
export async function buildSentenceTask(
  supabase: SupabaseClient,
  userId: string,
  level: Level,
  locale: Locale,
  avoidIds: string[] = []
): Promise<SentenceTask | null> {
  const [{ data: words }, { data: recent }] = await Promise.all([
    supabase.from("words").select(WORD_COLUMNS).eq("user_id", userId),
    supabase
      .from("sentence_attempts")
      .select("verdict")
      .eq("user_id", userId)
      .eq("attempt_no", 1)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const count = wordCountFor(((recent ?? []) as { verdict: Verdict }[]).map((r) => r.verdict));
  const picked = pickWords((words ?? []) as Word[], count, { avoidIds });
  if (picked.length === 0) return null;

  return {
    taskId: crypto.randomUUID(),
    words: picked.map(toTaskWord),
    ...pickPrompt(level, locale),
  };
}
