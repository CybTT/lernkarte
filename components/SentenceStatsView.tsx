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
        <div className="polkadot-card flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <p className="text-sm text-neutral-300">{t.stats.empty}</p>
          <Link
            href="/sentence"
            className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
          >
            {t.stats.startPractice}
          </Link>
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <section className="grid grid-cols-3 gap-3">
            {[
              { label: t.stats.sentences, value: String(stats.sentences) },
              { label: t.stats.correctRate, value: pct(stats.correctRate) },
              { label: t.stats.errorsPerSentence, value: perSentence(stats.errorsPerSentence) },
            ].map((tile) => (
              <div key={tile.label} className="polkadot-card flex flex-col items-center gap-1 rounded-2xl p-4 text-center">
                <span className="font-mono text-2xl font-bold text-white sm:text-3xl">{tile.value}</span>
                <span className="text-xs text-neutral-400">{tile.label}</span>
              </div>
            ))}
          </section>

          {/* Most common mistake types */}
          <section className="polkadot-card flex flex-col gap-4 rounded-2xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t.stats.mostCommon}
            </h2>
            {stats.byType.length === 0 ? (
              <p className="text-sm text-emerald-300">{t.stats.noErrors}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.byType.map(({ type, count }) => (
                  <li
                    key={type}
                    className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[14rem_1fr_auto]"
                    title={`${t.errorTypes[type]}: ${fmt(t.stats.errorCount, { n: count })}`}
                  >
                    <span className="truncate text-neutral-200">{t.errorTypes[type]}</span>
                    <span className="h-2.5 rounded-full bg-white/5">
                      <span
                        className="block h-full rounded-full bg-amber-400"
                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                      />
                    </span>
                    <span className="font-mono text-xs text-neutral-300">
                      {fmt(t.stats.errorCount, { n: count })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Week by week: mistakes per sentence (bar) with the week's numbers beside it */}
          <section className="polkadot-card flex flex-col gap-4 rounded-2xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t.stats.overTime} · {t.stats.errorsPerSentence}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {stats.weeks.map((week) => (
                <li
                  key={week.weekStart}
                  className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[6rem_1fr_auto]"
                  title={fmt(t.stats.weekOf, { date: weekLabel(week.weekStart) })}
                >
                  <span className="font-mono text-xs text-neutral-400">{weekLabel(week.weekStart)}</span>
                  <span className="h-2.5 rounded-full bg-white/5">
                    {week.errorsPerSentence !== null && (
                      <span
                        className="block h-full min-w-1 rounded-full bg-sky-400"
                        style={{ width: `${(week.errorsPerSentence / maxWeekErrors) * 100}%` }}
                      />
                    )}
                  </span>
                  <span className="whitespace-nowrap text-right font-mono text-xs text-neutral-300">
                    {week.sentences === 0 ? (
                      t.stats.noActivity
                    ) : (
                      <>
                        {perSentence(week.errorsPerSentence)}
                        <span className="text-neutral-500">
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
