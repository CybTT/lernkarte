import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { DATE_LOCALE, fmt, type Dictionary } from "@/lib/i18n";
import { APP_TIME_ZONE } from "@/lib/dates";
import type { SentenceStats } from "@/lib/sentenceStats";

/** Headline numbers, most common mistake types, and the week-by-week trend. */
export function SentenceStatsView({
  stats,
  t,
  locale,
}: {
  stats: SentenceStats;
  t: Dictionary;
  locale: Locale;
}) {
  const pct = (rate: number | null) =>
    rate === null ? t.stats.noActivity : fmt(t.flag.percent, { n: Math.round(rate * 100) });
  const perSentence = (n: number | null) =>
    n === null ? t.stats.noActivity : n.toLocaleString(DATE_LOCALE[locale], { maximumFractionDigits: 1 });
  const weekLabel = (weekStart: string) =>
    new Date(`${weekStart}T12:00:00Z`).toLocaleDateString(DATE_LOCALE[locale], {
      day: "numeric",
      month: "short",
      timeZone: APP_TIME_ZONE,
    });

  const maxTypeCount = Math.max(1, ...stats.byType.map((b) => b.count));
  const maxWeekErrors = Math.max(0.5, ...stats.weeks.map((w) => w.errorsPerSentence ?? 0));

  return (
    <>
      {stats.sentences === 0 ? (
        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <p className="max-w-[56ch] text-muted-text">{t.stats.empty}</p>
          <Link href="/sentence" className="btn w-fit">
            {t.stats.startPractice}
          </Link>
        </div>
      ) : (
        <>
          {/* Headline numbers, separated by rules */}
          <dl className="grid grid-cols-3 border-y border-border">
            {[
              { label: t.stats.sentences, value: String(stats.sentences) },
              { label: t.stats.correctRate, value: pct(stats.correctRate) },
              { label: t.stats.errorsPerSentence, value: perSentence(stats.errorsPerSentence) },
            ].map((tile, i) => (
              <div key={tile.label} className={i > 0 ? "border-l border-border py-4 pl-4" : "py-4 pr-4"}>
                <dt className="label">{tile.label}</dt>
                <dd className="font-mono text-3xl tabular-nums sm:text-4xl">{tile.value}</dd>
              </div>
            ))}
          </dl>

          {/* Most common mistake types */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-bold">{t.stats.mostCommon}</h2>
            {stats.byType.length === 0 ? (
              <p className="text-good">{t.stats.noErrors}</p>
            ) : (
              <ul className="flex flex-col">
                {stats.byType.map(({ type, count }) => (
                  <li
                    key={type}
                    className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-4 border-b border-border py-3 text-sm sm:grid-cols-[15rem_1fr_auto]"
                    title={`${t.errorTypes[type]}: ${fmt(t.stats.errorCount, { n: count })}`}
                  >
                    <span className="truncate">{t.errorTypes[type]}</span>
                    <span className="h-[3px] bg-text/10">
                      <span className="block h-full bg-red" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-text">
                      {fmt(t.stats.errorCount, { n: count })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Week by week: mistakes per sentence, with the week's numbers beside it */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-bold">
              {t.stats.overTime}
              <span className="label ml-3 font-sans">{t.stats.errorsPerSentence}</span>
            </h2>
            <ul className="flex flex-col">
              {stats.weeks.map((week) => (
                <li
                  key={week.weekStart}
                  className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-border py-2.5 text-sm sm:grid-cols-[6rem_1fr_auto]"
                  title={fmt(t.stats.weekOf, { date: weekLabel(week.weekStart) })}
                >
                  <span className="font-mono text-xs text-muted-text">{weekLabel(week.weekStart)}</span>
                  <span className="h-[3px] bg-text/10">
                    {week.errorsPerSentence !== null && (
                      <span
                        className="block h-full min-w-[3px] bg-text"
                        style={{ width: `${(week.errorsPerSentence / maxWeekErrors) * 100}%` }}
                      />
                    )}
                  </span>
                  <span className="whitespace-nowrap text-right font-mono text-xs tabular-nums">
                    {week.sentences === 0 ? (
                      <span className="text-muted-text">{t.stats.noActivity}</span>
                    ) : (
                      <>
                        {perSentence(week.errorsPerSentence)}
                        <span className="text-muted-text">
                          {" · "}
                          {fmt(t.stats.weekSummary, { n: week.sentences })} · {pct(week.correctRate)}
                        </span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
