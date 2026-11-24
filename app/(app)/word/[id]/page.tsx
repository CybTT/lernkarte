import { notFound } from "next/navigation";
import { createClient, requireUserId } from "@/lib/supabase/server";
import type { Review, Word } from "@/lib/types";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { MasteryBar } from "@/components/MasteryBar";
import { MeaningWithVariants } from "@/components/MeaningWithVariants";
import { WordDetailActions } from "@/components/WordDetailActions";
import { APP_TIME_ZONE } from "@/lib/dates";
import { getI18n } from "@/lib/i18n/server";
import { DATE_LOCALE, fmt } from "@/lib/i18n";

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [userId, { t, locale }] = await Promise.all([requireUserId(supabase), getI18n()]);

  const [{ data: word }, { data: reviews }] = await Promise.all([
    supabase.from("words").select("*").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase
      .from("reviews")
      .select("*")
      .eq("word_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!word) notFound();
  const w = word as Word;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3 break-words text-3xl sm:text-4xl font-bold font-display text-white">
          <ArticleBadge article={w.article} />
          <span className="min-w-0 [overflow-wrap:anywhere]">{w.term}</span>
          <SpeakButton text={w.term} />
        </div>
        <WordDetailActions wordId={w.id} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {w.needs_review && (
          <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300 border border-rose-500/30">
            {t.dictionary.badgeUnrecognized}
          </span>
        )}
        {!w.enriched && !w.needs_review && (
          <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-400 border border-white/10">
            {t.dictionary.badgeUnprocessed}
          </span>
        )}
        {w.original_input && (
          <span className="text-xs text-neutral-400">
            {fmt(t.word.youTyped, { input: w.original_input, term: w.term })}
          </span>
        )}
      </div>

      {/* Main Details Card */}
      <div className="polkadot-card flex flex-col gap-6 p-6 sm:p-8 rounded-2xl">
        <div className="flex flex-col gap-1">
          {w.ipa && <p className="font-mono text-sm text-neutral-400">[{w.ipa}]</p>}
          <div className="text-xl font-medium text-white">
            <MeaningWithVariants meaning={w.meaning_tr} others={w.meanings_tr} />
          </div>
          {w.usage_note && <p className="text-xs text-neutral-400 mt-1">{w.usage_note}</p>}
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
          <MasteryBar mastery={w.mastery} className="flex-1" />
          <span className="font-mono text-sm font-bold text-white">{Math.round(w.mastery)}/100</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 border-t border-white/10 pt-4">
          <Field label={t.word.plural} value={w.plural} />
          <Field label={t.word.partOfSpeech} value={w.part_of_speech} />
          <Field label={t.word.english} value={w.meaning_en} />
          <Field label={t.word.praeteritum} value={w.praeteritum} />
          <Field label={t.word.perfekt} value={w.perfekt} />
          <Field label={t.word.rektion} value={w.rektion} />
          <Field
            label={t.word.separable}
            value={w.separable == null ? null : w.separable ? t.word.yes : t.word.no}
          />
        </div>

        {w.word_family && w.word_family.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {w.word_family.map((fw) => (
              <span key={fw} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-300 border border-white/10">
                {fw}
              </span>
            ))}
          </div>
        )}

        {w.example_de && (
          <div className="mt-2 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="flex-1 space-y-1">
              <p className="font-medium text-white">&ldquo;{w.example_de}&rdquo;</p>
              {w.example_tr && <p className="text-neutral-400 text-xs">{w.example_tr}</p>}
            </div>
            <SpeakButton text={w.example_de} />
          </div>
        )}
      </div>

      {/* Review History */}
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold text-white">{t.word.history}</h2>
        {reviews && reviews.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#101116]/80 backdrop-blur-md">
            <table className="w-full text-left text-sm text-neutral-200">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t.word.colDate}</th>
                  <th className="py-3 px-4">{t.word.colType}</th>
                  <th className="py-3 px-4">{t.word.colResult}</th>
                  <th className="py-3 px-4">{t.word.colMastery}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(reviews as Review[]).map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-neutral-400 font-mono text-xs">
                      {new Date(r.created_at).toLocaleDateString(DATE_LOCALE[locale], { timeZone: APP_TIME_ZONE })}
                    </td>
                    <td className="py-3 px-4">{t.questionTypes[r.question_type] ?? r.question_type}</td>
                    <td className="py-3 px-4">
                      {r.correct ? (
                        <span className="text-emerald-400 font-semibold">{t.word.correct}</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">{t.word.wrong}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-neutral-400">
                      {r.mastery_before != null && r.mastery_after != null
                        ? `${Math.round(r.mastery_before)} → ${Math.round(r.mastery_after)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{t.word.noHistory}</p>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="font-medium text-white">{value}</p>
    </div>
  );
}
