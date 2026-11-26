import Link from "next/link";
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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-3">
        <Link href="/sentence" className="link w-fit text-sm text-muted-text">
          ← {t.sentence.title}
        </Link>
        <h1 className="text-4xl font-bold sm:text-6xl">{t.stats.title}</h1>
        <p className="max-w-[60ch] text-muted-text">
          {t.stats.subtitle} {t.stats.note}
        </p>
      </div>

      <SentenceStatsView stats={stats} t={t} locale={locale} />
    </main>
  );
}
