import Link from "next/link";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { buildStudySession, LEARNED_MASTERY_THRESHOLD } from "@/lib/engine";
import type { Word } from "@/lib/types";
import { StreakHeatmap } from "@/components/StreakHeatmap";
import { countByDay } from "@/lib/dates";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n";
import { GermanyFlagBlank } from "@/components/GermanyFlagBlank";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [userId, { t }] = await Promise.all([requireUserId(supabase), getI18n()]);

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

  return (
    <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-12 px-6 py-12">
      
      {/* POLKADOT HERO SECTION */}
      <section className="flex w-full flex-col items-center text-center">
        <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-sm">
          LernKarte
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-neutral-400 font-light max-w-md">
          {t.dashboard.tagline}
        </p>

        {/* Call to Action Button (Polkadot dark pill style) */}
        <div className="mt-8">
          {session.length > 0 ? (
            <Link
              href="/study"
              className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-8 py-4 text-lg font-medium shadow-2xl backdrop-blur-md transition-all hover:scale-105"
            >
              <span>{fmt(t.dashboard.studyToday, { n: session.length })}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>{t.dashboard.nothingDue}</span>
            </div>
          )}
        </div>
      </section>

      {/* GERMANY FLAG PROGRESS BLANK */}
      <section className="w-full">
        <GermanyFlagBlank
          t={t.flag}
          realProgress={realProgress}
          totalWords={totalWords}
          masteredWords={mastered}
          learningWords={stillLearning}
        />
      </section>

      {/* STATS CARDS GRID */}
      <section className="grid w-full grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="polkadot-card flex flex-col items-center justify-center p-6 rounded-2xl text-center transition-transform hover:-translate-y-1">
          <span className="font-mono text-3xl font-bold text-white">{dueWords.length}</span>
          <span className="mt-1 text-xs text-neutral-400 font-medium">{t.dashboard.due}</span>
        </div>
        
        <div className="polkadot-card flex flex-col items-center justify-center p-6 rounded-2xl text-center transition-transform hover:-translate-y-1">
          <span className="font-mono text-3xl font-bold text-sky-400">{stillLearning}</span>
          <span className="mt-1 text-xs text-neutral-400 font-medium">{t.dashboard.learning}</span>
        </div>
        
        <div className="polkadot-card flex flex-col items-center justify-center p-6 rounded-2xl text-center transition-transform hover:-translate-y-1">
          <span className="font-mono text-3xl font-bold text-emerald-400">{mastered}</span>
          <span className="mt-1 text-xs text-neutral-400 font-medium">{t.dashboard.mastered}</span>
        </div>
      </section>

      {/* LEECHES ALERT */}
      {leeches.length > 0 && (
        <Link
          href="/dictionary?filter=leeches"
          className="w-full flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 transition-all hover:bg-rose-500/20"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <span>{fmt(t.dashboard.leeches, { n: leeches.length })}</span>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {/* HEATMAP SECTION */}
      <section className="w-full polkadot-card p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t.dashboard.activity}
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {fmt(t.dashboard.reviewCount, {
              n: Object.values(heatmapCounts).reduce((a, b) => a + b, 0),
            })}
          </span>
        </div>
        <StreakHeatmap
          counts={heatmapCounts}
          label={t.heatmap.aria}
          cellLabel={t.heatmap.cell}
        />
      </section>

    </main>
  );
}
