import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { buildSentenceTask } from "@/lib/sentenceTaskServer";
import { isLevel } from "@/lib/sentenceTasks";
import { getI18n } from "@/lib/i18n/server";
import { SentenceBuilder } from "@/components/SentenceBuilder";
import type { Level } from "@/lib/types";

export default async function SentencePage() {
  const supabase = await createClient();
  const [userId, { t, locale }] = await Promise.all([requireUserId(supabase), getI18n()]);
  const { data: profile } = await supabase.from("profiles").select("level").eq("id", userId).single();
  const level: Level = isLevel(profile?.level) ? profile.level : "B1";
  const task = await buildSentenceTask(supabase, userId, level, locale);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">{t.sentence.title}</h1>
          <p className="text-sm text-neutral-400">{t.sentence.subtitle}</p>
        </div>
        <Link
          href="/sentence/stats"
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          {t.sentence.stats}
        </Link>
      </div>

      {task ? (
        <SentenceBuilder initialTask={task} initialLevel={level} />
      ) : (
        <div className="polkadot-card flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <h2 className="text-xl font-semibold text-white">{t.sentence.noWordsTitle}</h2>
          <p className="text-sm text-neutral-400">{t.sentence.noWordsBody}</p>
          <Link
            href="/dictionary"
            className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
          >
            {t.study.goToDictionary}
          </Link>
        </div>
      )}
    </main>
  );
}
