import Link from "next/link";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { buildStudySession } from "@/lib/engine";
import { attachOptions } from "@/lib/studyOptions";
import { applyMode, parseMode } from "@/lib/studyModes";
import type { Word } from "@/lib/types";
import { StudySession } from "@/components/StudySession";
import { StudyModeTabs } from "@/components/StudyModeTabs";
import { getI18n } from "@/lib/i18n/server";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: modeParam } = await searchParams;
  const mode = parseMode(modeParam);

  const supabase = await createClient();
  const [userId, { t }] = await Promise.all([requireUserId(supabase), getI18n()]);

  const [{ data: profile }, { data: candidates }] = await Promise.all([
    supabase.from("profiles").select("daily_goal").eq("id", userId).single(),
    supabase
      .from("words")
      .select("*")
      .eq("user_id", userId)
      .lte("next_review", new Date().toISOString()),
  ]);

  // Word selection (due pool, leech priority, mastered top-up) is identical in
  // every mode — only the question type differs.
  const session = applyMode(
    buildStudySession((candidates as Word[]) ?? [], profile?.daily_goal ?? 20),
    mode
  );

  const items = await attachOptions(supabase, session);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
        <StudyModeTabs active={mode} t={t.study} />
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold sm:text-5xl">{t.study.nothingDueTitle}</h1>
          <p className="max-w-[56ch] text-muted-text">{t.study.nothingDueBody}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/dictionary" className="btn">
              {t.study.goToDictionary}
            </Link>
            <Link href="/sentence" className="link text-sm">
              {t.dashboard.writeSentence}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <StudyModeTabs active={mode} t={t.study} />
      <StudySession items={items} />
    </main>
  );
}
