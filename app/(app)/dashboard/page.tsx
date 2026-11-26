import Link from "next/link";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { buildStudySession, LEARNED_MASTERY_THRESHOLD } from "@/lib/engine";
import type { Word } from "@/lib/types";
import { StreakHeatmap } from "@/components/StreakHeatmap";
import { countByDay } from "@/lib/dates";
import { APP_TIME_ZONE } from "@/lib/dates";
import { getI18n } from "@/lib/i18n/server";
import { DATE_LOCALE, fmt } from "@/lib/i18n";
import { GermanyFlagBlank } from "@/components/GermanyFlagBlank";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [userId, { t, locale }] = await Promise.all([requireUserId(supabase), getI18n()]);

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 91);

  // Independent queries run side by side instead of one after another.
  const [{ data: profile }, { data: wordsData }, { data: reviews }] = await Promise.all([
    supabase.from("profiles").select("daily_goal").eq("id", userId).single(),
    // Only the columns the dashboard needs, not every word's full details.
    supabase.from("words").select("id, mastery, next_review, is_leech").eq("user_id", userId),
    supabase
      .from("reviews")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", ninetyDaysAgo.toISOString()),
  ]);
  const dailyGoal = profile?.daily_goal ?? 20;
  const words = (wordsData as Word[]) ?? [];

  const dueWords = words.filter((w) => new Date(w.next_review) <= now);
  const stillLearning = words.filter((w) => w.mastery < LEARNED_MASTERY_THRESHOLD).length;
  const mastered = words.filter((w) => w.mastery >= LEARNED_MASTERY_THRESHOLD).length;
  const leeches = words.filter((w) => w.is_leech);

  const session = buildStudySession(dueWords, dailyGoal);

  // Average mastery across all words fills the flag card.
  const totalWords = words.length;
  const totalMasterySum = words.reduce((acc, w) => acc + Math.min(100, Math.max(0, w.mastery)), 0);
  const realProgress = totalWords > 0 ? Math.round(totalMasterySum / totalWords) : 0;

  const heatmapCounts = countByDay((reviews ?? []).map((r) => r.created_at as string));

  const today = now.toLocaleDateString(DATE_LOCALE[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: APP_TIME_ZONE,
  });
  const reviewTotal = Object.values(heatmapCounts).reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        {/* Today */}
        <section className="flex flex-col">
          <p className="label first-letter:uppercase">{today}</p>
          <h1 className="mt-3 max-w-[16ch] text-4xl font-bold leading-[1.05] sm:text-6xl">
            {session.length > 0
              ? fmt(t.dashboard.headlineDue, { n: session.length })
              : t.dashboard.headlineNone}
          </h1>
          <p className="mt-5 max-w-[52ch] text-muted-text">
            {session.length > 0 ? t.dashboard.subDue : t.dashboard.subNone}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {session.length > 0 ? (
              <Link href="/study" className="btn">
                {t.dashboard.startStudy}
              </Link>
            ) : (
              <Link href="/dictionary" className="btn">
                {t.dashboard.addWords}
              </Link>
            )}
            <Link href="/sentence" className="link text-sm">
              {t.dashboard.writeSentence}
            </Link>
          </div>

          <dl className="mt-12 border-t border-border">
            <div className="flex items-baseline justify-between border-b border-border py-3">
              <dt className="text-sm text-muted-text">{t.dashboard.due}</dt>
              <dd className="font-mono text-xl tabular-nums">{dueWords.length}</dd>
            </div>
            {leeches.length > 0 && (
              <div className="border-b border-border py-3">
                <Link href="/dictionary?filter=leeches" className="link text-sm text-red">
                  {fmt(t.dashboard.leeches, { n: leeches.length })}
                </Link>
              </div>
            )}
          </dl>
        </section>

        <GermanyFlagBlank
          t={t.flag}
          realProgress={realProgress}
          totalWords={totalWords}
          masteredWords={mastered}
          learningWords={stillLearning}
        />
      </div>

      <section className="mt-16 border-t border-border pt-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="label">{t.dashboard.activity}</h2>
          <span className="label">{fmt(t.dashboard.reviewCount, { n: reviewTotal })}</span>
        </div>
        <StreakHeatmap counts={heatmapCounts} label={t.heatmap.aria} cellLabel={t.heatmap.cell} />
      </section>
    </main>
  );
}
