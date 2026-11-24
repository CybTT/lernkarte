import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import { computeSentenceStats, type AttemptRow } from "@/lib/sentenceStats";
import { SentenceStatsView } from "@/components/SentenceStatsView";

const WEEKS = 8;

export default async function SentenceStatsPage() {
  const supabase = await createClient();
  const [userId, { t, locale }] = await Promise.all([requireUserId(supabase), getI18n()]);

  const since = new Date();
  since.setDate(since.getDate() - WEEKS * 7 - 7);
  // Only first tries count: they show the mistakes made without help.
  const { data } = await supabase
    .from("sentence_attempts")
    .select("created_at, verdict, error_types")
    .eq("user_id", userId)
    .eq("attempt_no", 1)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const stats = computeSentenceStats((data ?? []) as AttemptRow[], new Date(), WEEKS);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/sentence"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.sentence.title}
        </Link>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">{t.stats.title}</h1>
        <p className="text-sm text-neutral-400">
          {t.stats.subtitle} {t.stats.note}
        </p>
      </div>

      <SentenceStatsView stats={stats} t={t} locale={locale} />
    </main>
  );
}
