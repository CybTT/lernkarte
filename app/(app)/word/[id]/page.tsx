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

  const grammar = [
    { label: t.word.plural, value: w.plural },
    { label: t.word.partOfSpeech, value: w.part_of_speech },
    { label: t.word.praeteritum, value: w.praeteritum },
    { label: t.word.perfekt, value: w.perfekt },
    { label: t.word.rektion, value: w.rektion },
    { label: t.word.separable, value: w.separable == null ? null : w.separable ? t.word.yes : t.word.no },
  ].filter((g) => g.value);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-20">
        {/* The entry, set like a dictionary page */}
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {w.needs_review && <span className="rounded-[3px] border border-red/50 px-1.5 font-mono text-[11px] text-red">{t.dictionary.badgeUnrecognized}</span>}
            {!w.enriched && !w.needs_review && <span className="rounded-[3px] border border-border px-1.5 font-mono text-[11px] text-muted-text">{t.dictionary.badgeUnprocessed}</span>}
            {w.original_input && (
              <span className="hand text-xl text-muted-text">{fmt(t.word.youTyped, { input: w.original_input, term: w.term })}</span>
            )}
          </div>

          <h1 lang="de" className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-4 text-5xl font-bold [overflow-wrap:anywhere] sm:text-7xl">
            <ArticleBadge article={w.article} className="text-3xl sm:text-4xl" />
            <span className="min-w-0">{w.term}</span>
            <SpeakButton text={w.term} className="self-center" />
          </h1>
          {w.ipa && <p className="mt-2 font-mono text-sm text-muted-text">[{w.ipa}]</p>}

          <div className="mt-8 text-xl">
            <MeaningWithVariants meaning={w.meaning_tr} others={w.meanings_tr} />
            {w.meaning_en && <span lang="en" className="ml-3 text-base text-muted-text">{w.meaning_en}</span>}
          </div>

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-border pt-6 text-sm">
            {w.usage_note && (
              <>
                <dt className="label pt-0.5">{t.landing.entryUsageLabel}</dt>
                <dd className="text-text/85">{w.usage_note}</dd>
              </>
            )}
            {w.example_de && (
              <>
                <dt className="label pt-0.5">{t.landing.entryExampleLabel}</dt>
                <dd className="flex items-start gap-2">
                  <span>
                    <span lang="de" className="italic">{w.example_de}</span>
                    {w.example_tr && <span className="mt-1 block text-muted-text">{w.example_tr}</span>}
                  </span>
                  <SpeakButton text={w.example_de} />
                </dd>
              </>
            )}
            {grammar.map((g) => (
              <div key={g.label} className="contents">
                <dt className="label pt-0.5">{g.label}</dt>
                <dd lang="de">{g.value}</dd>
              </div>
            ))}
          </dl>

          {w.word_family && w.word_family.length > 0 && (
            <p lang="de" className="mt-6 border-t border-border pt-4 text-sm text-muted-text">
              {w.word_family.join(" · ")}
            </p>
          )}
        </article>

        {/* Margin column: mastery, actions, history */}
        <aside className="flex flex-col gap-8">
          <div>
            <p className="label">{t.word.colMastery}</p>
            <p className="font-mono text-4xl tabular-nums">{Math.round(w.mastery)}<span className="text-lg text-muted-text">/100</span></p>
            <MasteryBar mastery={w.mastery} className="mt-3" />
          </div>

          <WordDetailActions wordId={w.id} />

          <section>
            <h2 className="label mb-2">{t.word.history}</h2>
            {reviews && reviews.length > 0 ? (
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sr-only">
                  <tr>
                    <th scope="col">{t.word.colDate}</th>
                    <th scope="col">{t.word.colType}</th>
                    <th scope="col">{t.word.colResult}</th>
                    <th scope="col">{t.word.colMastery}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reviews as Review[]).map((r) => (
                    <tr key={r.id} className="border-b border-border">
                      <td className="py-2 pr-3 font-mono text-xs text-muted-text">
                        {new Date(r.created_at).toLocaleDateString(DATE_LOCALE[locale], { timeZone: APP_TIME_ZONE })}
                      </td>
                      <td className="py-2 pr-3">{t.questionTypes[r.question_type] ?? r.question_type}</td>
                      <td className={`py-2 pr-3 ${r.correct ? "text-text" : "text-red"}`}>
                        {r.correct ? t.word.correct : t.word.wrong}
                      </td>
                      <td className="py-2 text-right font-mono text-xs text-muted-text">
                        {r.mastery_before != null && r.mastery_after != null
                          ? `${Math.round(r.mastery_before)}→${Math.round(r.mastery_after)}`
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-text">{t.word.noHistory}</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
