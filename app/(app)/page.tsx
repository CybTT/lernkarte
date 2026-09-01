import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildStudySession, LEARNED_MASTERY_THRESHOLD } from "@/lib/engine";
import type { Word } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StreakHeatmap } from "@/components/StreakHeatmap";

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

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: reviews } = await supabase
    .from("reviews")
    .select("created_at")
    .eq("user_id", user!.id)
    .gte("created_at", ninetyDaysAgo.toISOString());

  const heatmapCounts: Record<string, number> = {};
  for (const r of reviews ?? []) {
    const key = new Date(r.created_at as string).toISOString().slice(0, 10);
    heatmapCounts[key] = (heatmapCounts[key] ?? 0) + 1;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-10 p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Button
          size="lg"
          className="h-16 px-10 text-lg"
          disabled={session.length === 0}
          render={<Link href="/study" />}
          nativeButton={false}
        >
          {session.length > 0
            ? `Bugün çalış — ${session.length} kelime`
            : "Bugünlük due kelime yok 🎉"}
        </Button>
      </div>

      <div className="grid w-full grid-cols-3 gap-4 text-center">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-2xl font-semibold">{dueWords.length}</span>
            <span className="text-xs text-muted-foreground">Bugün due</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-2xl font-semibold">{stillLearning}</span>
            <span className="text-xs text-muted-foreground">Öğrenilmekte</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-2xl font-semibold">{mastered}</span>
            <span className="text-xs text-muted-foreground">Öğrenilmiş</span>
          </CardContent>
        </Card>
      </div>

      {leeches.length > 0 && (
        <Link
          href="/dictionary?filter=leeches"
          className="w-full rounded-lg border border-article-die/30 bg-article-die/10 p-4 text-center text-sm text-article-die transition-colors hover:bg-article-die/15"
        >
          {leeches.length} kelimede zorlanıyorsun — gözden geçir
        </Link>
      )}

      <div className="flex w-full flex-col gap-2">
        <p className="text-xs text-muted-foreground">Son 90 gün</p>
        <StreakHeatmap counts={heatmapCounts} />
      </div>
    </main>
  );
}
