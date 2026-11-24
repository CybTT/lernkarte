import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildStudySession, LEARNED_MASTERY_THRESHOLD } from "@/lib/engine";
import type { Word } from "@/lib/types";
import { StreakHeatmap } from "@/components/StreakHeatmap";
import { countByDay } from "@/lib/dates";
import { GermanyFlagBlank } from "@/components/GermanyFlagBlank";
import { ArrowRight, BookOpen, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_goal")
    .eq("id", user!.id)
    .single();
  const dailyGoal = profile?.daily_goal ?? 20;

  const { data: wordsData } = await supabase.from("words").select("*").eq("user_id", user!.id);
  const words = (wordsData as Word[]) ?? [];

  const now = new Date();
  const dueWords = words.filter((w) => new Date(w.next_review) <= now);
  const stillLearning = words.filter((w) => w.mastery < LEARNED_MASTERY_THRESHOLD).length;
  const mastered = words.filter((w) => w.mastery >= LEARNED_MASTERY_THRESHOLD).length;
  const leeches = words.filter((w) => w.is_leech);

  const session = buildStudySession(dueWords, dailyGoal);

  // Compute average mastery level or mastered ratio for Germany Flag Blank fill
  const totalWords = words.length;
  const totalMasterySum = words.reduce((acc, w) => acc + Math.min(100, Math.max(0, w.mastery)), 0);
  const realProgress = totalWords > 0 ? Math.round(totalMasterySum / totalWords) : 0;

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 91);
  const { data: reviews } = await supabase
    .from("reviews")
    .select("created_at")
    .eq("user_id", user!.id)
    .gte("created_at", ninetyDaysAgo.toISOString());

  const heatmapCounts = countByDay((reviews ?? []).map((r) => r.created_at as string));

  return (
    <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-12 px-6 py-12">
      
      {/* POLKADOT HERO SECTION */}
      <section className="flex w-full flex-col items-center text-center">
        <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-sm">
          LernKarte
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-neutral-400 font-light max-w-md">
          Almanca kelimeler, akıllı hafıza.
        </p>

        {/* Call to Action Button (Polkadot dark pill style) */}
        <div className="mt-8">
          {session.length > 0 ? (
            <Link
              href="/study"
              className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-8 py-4 text-lg font-medium shadow-2xl backdrop-blur-md transition-all hover:scale-105"
            >
              <span>Bugün çalış — {session.length} kelime</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Bugünlük tekrar edilecek kelime yok 🎉</span>
            </div>
          )}
        </div>
      </section>

      {/* GERMANY FLAG PROGRESS BLANK */}
      <section className="w-full">
        <GermanyFlagBlank
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
          <span className="mt-1 text-xs text-neutral-400 font-medium">Tekrar Bekleyen (Due)</span>
        </div>
        
        <div className="polkadot-card flex flex-col items-center justify-center p-6 rounded-2xl text-center transition-transform hover:-translate-y-1">
          <span className="font-mono text-3xl font-bold text-sky-400">{stillLearning}</span>
          <span className="mt-1 text-xs text-neutral-400 font-medium">Öğrenilmekte</span>
        </div>
        
        <div className="polkadot-card flex flex-col items-center justify-center p-6 rounded-2xl text-center transition-transform hover:-translate-y-1">
          <span className="font-mono text-3xl font-bold text-emerald-400">{mastered}</span>
          <span className="mt-1 text-xs text-neutral-400 font-medium">Tam Öğrenilmiş</span>
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
            <span>{leeches.length} kelimede zorlanıyorsun — gözden geçir</span>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {/* HEATMAP SECTION */}
      <section className="w-full polkadot-card p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Aktivite Geçmişi (Son 90 Gün)
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {Object.values(heatmapCounts).reduce((a, b) => a + b, 0)} Tekrar
          </span>
        </div>
        <StreakHeatmap counts={heatmapCounts} />
      </section>

    </main>
  );
}
