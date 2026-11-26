import Link from "next/link";
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-4xl font-bold sm:text-6xl">{t.sentence.title}</h1>
          <p className="max-w-[46ch] text-muted-text">{t.sentence.subtitle}</p>
          <Link href="/sentence/stats" className="link w-fit text-sm">
            {t.sentence.stats}
          </Link>
        </div>

        {task ? (
          <SentenceBuilder initialTask={task} initialLevel={level} />
        ) : (
          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <h2 className="text-2xl font-bold">{t.sentence.noWordsTitle}</h2>
            <p className="max-w-[56ch] text-muted-text">{t.sentence.noWordsBody}</p>
            <Link href="/dictionary" className="btn w-fit">
              {t.study.goToDictionary}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
