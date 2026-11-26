import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import type { Evaluation } from "@/lib/sentenceCheck";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SentenceFeedback } from "@/components/SentenceBuilder";
import { CorrectionCard } from "@/components/landing/CorrectionCard";

const GITHUB_URL = "https://github.com/CybTT/lernkarte";

// Link previews and search results are in English, whatever the visitor's language.
export const metadata: Metadata = {
  title: "LernKarte — Write a sentence with every German word you learn",
  description:
    "A German vocabulary trainer for Turkish speakers (A1–B1): AI-enriched words, spaced repetition, and explained feedback on the sentences you write.",
};

/*
 * The landing page follows the app's exercise-book language (see globals.css):
 * warm ink, index-card paper, and the correction red as the only accent.
 * Left-aligned copy, one 3px radius, lines instead of shadows. The hero card
 * is corrected in red pen as the page loads; the rest stays still.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const [{ data: auth }, { t }] = await Promise.all([supabase.auth.getClaims(), getI18n()]);
  if (auth?.claims?.sub) redirect("/dashboard");

  const L = t.landing;

  const steps = [
    { title: L.s1Title, body: L.s1Body },
    { title: L.s2Title, body: L.s2Body },
    { title: L.s3Title, body: L.s3Body },
    { title: L.s4Title, body: L.s4Body },
  ];

  const modes = [
    { name: t.study.modes.smart, what: L.modeSmart },
    { name: t.study.modes.flashcard, what: L.modeFlashcard },
    { name: t.study.modes.typing, what: L.modeTyping },
    { name: t.study.modes.translate, what: L.modeTranslate },
    { name: t.sentence.title, what: L.modeSentence },
  ];

  const demoEvaluation: Evaluation = {
    verdict: "major",
    praise: L.demoPraise,
    corrected: "Ich habe im Urlaub mit meinem Freund Fußball gespielt.",
    errors: [
      {
        fragment: "meine",
        type: "kasus",
        correction: "meinem",
        explanation: L.demoExplanation,
        rule: "mit + Dativ",
        located: true,
      },
    ],
    targetWords: [
      { term: "Freund", used: true, correctMeaning: true, correctForm: false, note: L.demoWordNote },
      { term: "spielen", used: true, correctMeaning: true, correctForm: true, note: "" },
    ],
    suggestion: null,
    grammarGoalMet: true,
    grammarGoalNote: L.demoGoalNote,
  };

  const button =
    "inline-flex items-center rounded-[3px] bg-text px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-ink text-text">
      <header className="border-b border-text/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 rounded-[3px]">
            <span aria-hidden className="h-3 w-3 rounded-full bg-red" />
            <span className="font-display text-xl font-bold tracking-tight">LernKarte</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <LanguageSwitcher variant="plain" />
            <Link
              href="/login"
              className="whitespace-nowrap rounded-[3px] px-2 py-2 text-sm text-text/80 hover:text-text"
            >
              {L.login}
            </Link>
            <Link href="/login?mode=signup" className="hidden whitespace-nowrap rounded-[3px] bg-text px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white sm:inline-flex">
              {L.signup}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* 1. Hero: asymmetric, the corrected card on the right */}
        <section className="mx-auto grid w-full max-w-6xl gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div>
            <p className="font-mono text-xs text-muted-text">{L.audience}</p>
            <h1 className="mt-5 max-w-[15ch] font-display text-[2.7rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.6rem]">
              {L.title}
            </h1>
            <p className="mt-7 max-w-[56ch] text-lg leading-relaxed text-text/85">{L.lead}</p>
            <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-muted-text">{L.altLead}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/login?mode=signup" className={button}>
                {L.signup}
              </Link>
              <Link
                href="/login"
                className="rounded-[3px] text-sm text-text/80 underline decoration-text/30 underline-offset-4 hover:text-text hover:decoration-text"
              >
                {L.haveAccount}
              </Link>
            </div>
          </div>
          <div className="lg:rotate-[1.5deg]">
            <CorrectionCard
              task={L.cardTask}
              why={L.cardWhy}
              hide={L.cardHide}
              explanation={L.cardExplanation}
              handClassName={"hand"}
            />
          </div>
        </section>

        {/* 2. The path of a word: numbered columns divided by rules, dense */}
        <section className="border-t border-text/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{L.stepsTitle}</h2>
            <ol className="mt-10 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="border-t border-text/15 pt-5 sm:pr-8 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:first:border-l-0 lg:first:pl-0"
                >
                  <span className="font-mono text-sm text-[#e2462c]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text/70">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3. Full-width band, a different tone: the real feedback screen */}
        <section className="bg-ink-2">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="flex min-w-0 flex-col gap-5">
              <h2 className="font-display text-3xl font-bold leading-tight sm:text-[2.6rem]">
                {L.demoTitle}
              </h2>
              <p className="max-w-[60ch] leading-relaxed text-text/80">{L.demoBody}</p>
              <p className="max-w-[60ch] border-l-2 border-red pl-4 leading-relaxed text-text/80">
                {L.demoHonest}
              </p>
            </div>
            <figure className="min-w-0">
              <SentenceFeedback
                t={t}
                result={{
                  sentence: "Ich habe im Urlaub mit meine Freund Fußball gespielt.",
                  attemptNo: 1,
                  mastery: [],
                }}
                evaluation={demoEvaluation}
                final
                showActions={false}
              />
              <figcaption className="mt-3 font-mono text-xs text-muted-text">{L.demoCaption}</figcaption>
            </figure>
          </div>
        </section>

        {/* 4. Breathing room: a dictionary entry set like a printed page */}
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="flex flex-col gap-5">
            <h2 className="max-w-[18ch] font-display text-3xl font-bold leading-tight sm:text-[2.6rem]">
              {L.entryTitle}
            </h2>
            <p className="max-w-[56ch] leading-relaxed text-text/75">{L.entryBody}</p>
          </div>
          <article className="border-t border-text/20 pt-6">
            <p className={`hand text-2xl text-muted-text`}>{L.entryTyped}</p>
            <h3
              lang="de"
              className="mt-4 flex flex-wrap items-baseline gap-x-4 font-display text-6xl font-bold sm:text-7xl"
            >
              <span className="text-3xl text-article-der sm:text-4xl">der</span>
              Fei·er·abend
            </h3>
            <p className="mt-3 font-mono text-sm text-muted-text">-s, -e · [ˈfaɪ̯ɐˌʔaːbn̩t]</p>
            <ol lang="tr" className="mt-6 flex flex-col gap-1.5 text-lg">
              <li>
                <span className="mr-3 font-mono text-sm text-muted-text">1</span>iş çıkışı
              </li>
              <li>
                <span className="mr-3 font-mono text-sm text-muted-text">2</span>mesai sonrası
              </li>
              <li lang="en">
                <span className="mr-3 font-mono text-sm text-muted-text">EN</span>end of the working day
              </li>
            </ol>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-text/10 pt-5 text-sm">
              <dt className="font-mono text-xs text-muted-text">{L.entryUsageLabel}</dt>
              <dd lang="tr" className="text-text/80">
                İş çıkışı için günlük konuşmada çok sık kullanılır.
              </dd>
              <dt className="font-mono text-xs text-muted-text">{L.entryExampleLabel}</dt>
              <dd>
                <span lang="de" className="italic">
                  Nach dem Feierabend gehe ich oft joggen.
                </span>
                <span lang="tr" className="mt-1 block text-text/60">
                  İş çıkışından sonra sık sık koşuya giderim.
                </span>
              </dd>
            </dl>
          </article>
        </section>

        {/* 5. A dense table */}
        <section className="border-t border-text/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{L.modesTitle}</h2>
            <table className="mt-8 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-text/20 font-mono text-xs text-muted-text">
                  <th scope="col" className="w-[34%] py-2 pr-6 font-normal sm:w-[26%]">
                    {L.modesColMode}
                  </th>
                  <th scope="col" className="py-2 font-normal">
                    {L.modesColWhat}
                  </th>
                </tr>
              </thead>
              <tbody>
                {modes.map((mode) => (
                  <tr key={mode.name} className="border-b border-text/10 align-top">
                    <th scope="row" className="py-4 pr-6 font-display text-base font-bold sm:text-lg">
                      {mode.name}
                    </th>
                    <td className="max-w-[70ch] py-4 leading-relaxed text-text/75">{mode.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. Closing */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-28 pt-20 sm:px-8">
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-6xl">{L.closingTitle}</h2>
          <p className="mt-4 text-text/70">{L.closingBody}</p>
          <Link href="/login?mode=signup" className={`${button} mt-8`}>
            {L.signup}
          </Link>
        </section>
      </main>

      <footer className="border-t border-text/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-text sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-center gap-2.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-red" />
            LernKarte
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="rounded-[3px] hover:text-text">
              {L.login}
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-[3px] hover:text-text"
            >
              {L.sourceCode} ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
