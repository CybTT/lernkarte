import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOptions, displayTerm, normalizePos, pickDistractors } from "./distractors";
import type { DictionaryPoolEntry, StudyItem, StudySessionItem } from "./types";

const POOL_COLUMNS = "id, term, article, plural_hint, part_of_speech, level, example_de";
/** How many pool rows to pull per part of speech before ranking locally. */
const POOL_WINDOW = 300;
const OPTION_COUNT = 4;

function isMultipleChoice(item: StudySessionItem): boolean {
  return item.question_type === "match" || item.question_type === "multiple_choice";
}

/** Random window into the pool so sessions don't always draw the same slice. */
async function fetchPoolWindow(
  supabase: SupabaseClient,
  partOfSpeech: string
): Promise<DictionaryPoolEntry[]> {
  const { count } = await supabase
    .from("dictionary_pool")
    .select("id", { count: "exact", head: true })
    .eq("part_of_speech", partOfSpeech);

  const total = count ?? 0;
  const offset = total > POOL_WINDOW ? Math.floor(Math.random() * (total - POOL_WINDOW)) : 0;

  const { data } = await supabase
    .from("dictionary_pool")
    .select(POOL_COLUMNS)
    .eq("part_of_speech", partOfSpeech)
    .range(offset, offset + POOL_WINDOW - 1);

  return (data as DictionaryPoolEntry[] | null) ?? [];
}

/**
 * Attaches pre-shuffled German answer options to every multiple-choice item,
 * drawing distractors from the shared `dictionary_pool` (never from the user's
 * own words). Purely local ranking — no AI call.
 *
 * If the pool can't supply enough distractors (e.g. it hasn't been seeded yet),
 * the item is downgraded to a typing question rather than rendering a broken
 * one-option quiz.
 */
export async function attachOptions(
  supabase: SupabaseClient,
  session: StudySessionItem[]
): Promise<StudyItem[]> {
  const mcItems = session.filter(isMultipleChoice);
  if (mcItems.length === 0) return session;

  const neededPos = new Set(mcItems.map((item) => normalizePos(item.word.part_of_speech)));
  const poolByPos = new Map<string, DictionaryPoolEntry[]>();
  await Promise.all(
    [...neededPos].map(async (pos) => {
      poolByPos.set(pos, await fetchPoolWindow(supabase, pos));
    })
  );

  return session.map((item) => {
    if (!isMultipleChoice(item)) return item;

    const pool = poolByPos.get(normalizePos(item.word.part_of_speech)) ?? [];
    const distractors = pickDistractors(
      pool,
      { term: item.word.term, part_of_speech: item.word.part_of_speech },
      OPTION_COUNT - 1
    );

    if (distractors.length < OPTION_COUNT - 1) {
      return { ...item, question_type: "typing" as const };
    }

    const isNoun =
      normalizePos(item.word.part_of_speech) === "noun" || item.word.article !== null;
    const correct = displayTerm(item.word.term, isNoun);
    return { ...item, options: buildOptions(correct, distractors) };
  });
}
