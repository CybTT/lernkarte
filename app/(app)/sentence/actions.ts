"use server";

import { createClient, requireUserId } from "@/lib/supabase/server";
import { buildSentenceTask } from "@/lib/sentenceTaskServer";
import { isLevel, type SentenceTask } from "@/lib/sentenceTasks";
import { getLocale } from "@/lib/i18n/server";
import type { Level } from "@/lib/types";

/** The next task, avoiding the words just practised. */
export async function newSentenceTask(avoidIds: string[]): Promise<SentenceTask | null> {
  const supabase = await createClient();
  const [userId, locale] = await Promise.all([requireUserId(supabase), getLocale()]);
  const { data: profile } = await supabase.from("profiles").select("level").eq("id", userId).single();
  const level: Level = isLevel(profile?.level) ? profile.level : "B1";
  const avoid = Array.isArray(avoidIds) ? avoidIds.filter((id) => typeof id === "string").slice(0, 3) : [];
  return buildSentenceTask(supabase, userId, level, locale, avoid);
}

/** Saves the learner's level (A1–B1); feedback and grammar goals adapt to it. */
export async function setLevel(level: Level): Promise<void> {
  if (!isLevel(level)) throw new Error("Invalid level");
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  const { error } = await supabase.from("profiles").update({ level }).eq("id", userId);
  if (error) throw new Error("Could not save level");
}
