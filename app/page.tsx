import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, ExternalLink, MousePointerClick, PenLine, Puzzle, Repeat2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import { lastDayKeys } from "@/lib/dates";
import { CONTEXTS, GRAMMAR_GOALS } from "@/lib/sentenceTasks";
import type { Evaluation } from "@/lib/sentenceCheck";
import type { Word } from "@/lib/types";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GermanyFlagBlank } from "@/components/GermanyFlagBlank";
import { StreakHeatmap } from "@/components/StreakHeatmap";
import { SentenceFeedback, TaskCard } from "@/components/SentenceBuilder";
import { WordFullCard } from "@/components/WordFullCard";

const GITHUB_URL = "https://github.com/CybTT/lernkarte";

// Link previews and search results are in English, whatever the visitor's language.
export const metadata: Metadata = {
  title: "LernKarte — Learn German vocabulary, then use it",
  description:
    "A German vocabulary trainer for Turkish speakers (A1–B1): AI-enriched words, spaced repetition, and explained feedback on the sentences you write.",
};

export default async function LandingPage() {
  const supabase = await createClient();
  const [{ data: auth }, { t, locale }] = await Promise.all([supabase.auth.getClaims(), getI18n()]);
  if (auth?.claims?.sub) redirect("/dashboard");

  const L = t.landing;

  // Sample data for the live previews below — the app's real components.
  const heatmap = Object.fromEntries(
    lastDayKeys(90).map((day, i) => [day, (i * 37) % 11 > 3 ? ((i * 13) % 17) + 1 : 0])
  );
  const perfekt = GRAMMAR_GOALS.find((g) => g.id === "perfekt")!;
  const demoTask = {
    context: CONTEXTS[5][locale],
    grammarGoal: { id: perfekt.id, name: perfekt.name, instruction: perfekt.instruction[locale] },
    words: [
      { id: "demo-1", term: "Freund", article: "der" as const, meaning_tr: "arkadaş", part_of_speech: "noun" as const },
      { id: "demo-2", term: "spielen", article: null, meaning_tr: "oynamak", part_of_speech: "verb" as const },
    ],
  };
  const demoSentence = "Ich habe im Urlaub mit meine Freund Fußball gespielt.";
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
  const demoWord = {
    id: "demo-word",
    term: "Feierabend",
    article: "der",
    plural: "Feierabende",
    ipa: "ˈfaɪ̯ɐˌʔaːbn̩t",
    meaning_tr: "iş çıkışı",
    meanings_tr: ["mesai sonrası", "akşam dinlenmesi"],
    meaning_en: "end of the working day",
    usage_note: "İş çıkışı için günlük konuşmada çok sık kullanılır.",
    example_de: "Nach dem Feierabend gehe ich oft joggen.",
    example_tr: "İş çıkışından sonra sık sık koşuya giderim.",
  } as Word;

  const features = [
    { icon: Repeat2, title: L.f1Title, body: L.f1Body },
    { icon: Sparkles, title: L.f2Title, body: L.f2Body },
    { icon: PenLine, title: L.f3Title, body: L.f3Body },
    { icon: Puzzle, title: L.f4Title, body: L.f4Body },
  ];

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-clip">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07080a]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-xl font-bold tracking-tight text-white">LernKarte</span>
          </Link>
          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-neutral-300 transition-colors hover:text-white sm:px-4"
            >
              {L.login}
            </Link>
            <Link
              href="/login?mode=signup"
              className="hidden whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#07080a] transition-transform hover:scale-[1.03] sm:block"
            >
              {L.getStarted}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-gradient-to-r from-red-600/15 via-amber-400/10 to-transparent blur-3xl"
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-neutral-300">
            <FlagDots />
            {L.eyebrow}
          </span>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl">
            {L.titleStart}
            <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-red-500 bg-clip-text text-transparent">
              {L.titleEnd}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-neutral-300 sm:text-lg">{L.lead}</p>
          {L.altLead && <p className="mt-3 max-w-2xl text-sm italic text-neutral-500">{L.altLead}</p>}
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#07080a] shadow-[0_0_40px_-10px_rgba(255,204,0,0.6)] transition-transform hover:scale-[1.03]"
            >
              {L.getStarted}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {L.login}
            </Link>
          </div>

          {/* Product preview */}
          <Preview label={L.sampleScreen} className="mt-16 w-full max-w-3xl">
            <div className="flex flex-col gap-4 p-4 sm:p-6">
              <GermanyFlagBlank t={t.flag} realProgress={64} totalWords={148} masteredWords={52} learningWords={96} />
              <div className="rounded-2xl border border-white/10 bg-[#0d0e12]/80 p-4 text-left sm:p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {t.dashboard.activity}
                </p>
                <StreakHeatmap counts={heatmap} label={t.heatmap.aria} cellLabel={t.heatmap.cell} />
              </div>
            </div>
          </Preview>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{L.featuresTitle}</h2>
            <p className="mt-4 text-neutral-400">{L.featuresLead}</p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="polkadot-card flex flex-col gap-3 rounded-2xl p-6 transition-transform hover:-translate-y-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-neutral-400">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Spotlight: sentence building */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-5">
            <Eyebrow>{L.sentenceEyebrow}</Eyebrow>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{L.sentenceTitle}</h2>
            <ul className="flex flex-col gap-3">
              {[L.sentencePoint1, L.sentencePoint2, L.sentencePoint3, L.sentencePoint4].map((point) => (
                <li key={point} className="flex items-start gap-3 text-neutral-300">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="flex items-center gap-2 text-sm text-amber-200/80">
              <MousePointerClick className="h-4 w-4 shrink-0" />
              {L.sentenceHint}
            </p>
          </div>
          <Preview label={L.sampleScreen} className="min-w-0">
            <div className="flex flex-col gap-4 p-4 text-left sm:p-5">
              <TaskCard t={t} task={demoTask} />
              <SentenceFeedback
                t={t}
                result={{ sentence: demoSentence, attemptNo: 1, mastery: [] }}
                evaluation={demoEvaluation}
                final
                showActions={false}
              />
            </div>
          </Preview>
        </section>

        {/* Spotlight: dictionary */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="order-last min-w-0 lg:order-first">
            <Preview label={L.sampleScreen}>
              <div className="p-4 text-left sm:p-5">
                <WordFullCard word={demoWord} />
              </div>
            </Preview>
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <Eyebrow>{L.enrichEyebrow}</Eyebrow>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{L.enrichTitle}</h2>
            <p className="text-neutral-300">{L.enrichBody}</p>
            <p className="flex items-start gap-3 text-neutral-400">
              <Puzzle className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
              <span>{L.f4Body}</span>
            </p>
          </div>
        </section>

        {/* Final call to action */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="polkadot-card relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
            <div aria-hidden className="absolute inset-x-0 top-0 flex h-1">
              <span className="flex-1 bg-neutral-800" />
              <span className="flex-1 bg-[#dd0000]" />
              <span className="flex-1 bg-[#ffcc00]" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{L.finalTitle}</h2>
            <p className="mt-4 text-neutral-400">{L.finalBody}</p>
            <Link
              href="/login?mode=signup"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#07080a] transition-transform hover:scale-[1.03]"
            >
              {L.getStarted}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo small />
            <span>{L.builtWith}</span>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
          >
            GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </footer>
    </div>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span
      className={
        small
          ? "flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/10"
          : "flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10"
      }
    >
      <span className={small ? "h-2 w-2 rounded-full bg-gradient-to-r from-red-500 to-amber-400" : "h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-amber-400"} />
    </span>
  );
}

function FlagDots() {
  return (
    <span aria-hidden className="flex gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#dd0000]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#ffcc00]" />
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{children}</span>;
}

/** A browser-window frame around a live sample of the app. */
function Preview({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={`relative ${className}`}>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0b0e]/90 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</span>
        </div>
        {children}
      </div>
    </figure>
  );
}
