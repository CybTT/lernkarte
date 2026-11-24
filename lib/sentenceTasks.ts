import type { Locale } from "./i18n/config";
import type { Level, Word } from "./types";

// ============================================================
// "Cümle Kur" tasks: which words, which situation, which grammar goal.
// Everything here is local (no AI call) so building a task costs nothing.
// ============================================================

export type Verdict = "correct" | "minor" | "major";

/** The parts of a word a task needs. */
export type TaskWord = Pick<Word, "id" | "term" | "article" | "meaning_tr" | "part_of_speech">;

export interface GrammarGoal {
  id: string;
  /** German grammar term, as Claude sees it. */
  name: string;
  level: Level;
  instruction: Record<Locale, string>;
}

export interface SentenceTask {
  taskId: string;
  words: TaskWord[];
  /** Situation to write about, in the interface language. */
  context: string;
  grammarGoal: { id: string; name: string; instruction: string } | null;
}

const LEVEL_ORDER: Record<Level, number> = { A1: 1, A2: 2, B1: 3 };

export function isLevel(value: unknown): value is Level {
  return value === "A1" || value === "A2" || value === "B1";
}

// ------------------------------------------------------------
// Situations — generic enough to fit any word.
// ------------------------------------------------------------
export const CONTEXTS: Record<Locale, string>[] = [
  {
    tr: "Bir arkadaşına hafta sonu planını anlat.",
    en: "Tell a friend about your weekend plans.",
    de: "Erzähl einem Freund von deinen Wochenendplänen.",
  },
  {
    tr: "İş yerinde bir meslektaşına bugün ne yaptığını anlat.",
    en: "Tell a colleague at work what you did today.",
    de: "Erzähl einer Kollegin, was du heute gemacht hast.",
  },
  {
    tr: "Bir restoranda garsona bir şey sor.",
    en: "Ask the waiter something in a restaurant.",
    de: "Frag im Restaurant die Bedienung etwas.",
  },
  {
    tr: "Ev sahibine evdeki bir sorunu anlat.",
    en: "Describe a problem in your flat to your landlord.",
    de: "Beschreib deinem Vermieter ein Problem in der Wohnung.",
  },
  {
    tr: "Doktora nasıl hissettiğini anlat.",
    en: "Tell the doctor how you feel.",
    de: "Erzähl der Ärztin, wie du dich fühlst.",
  },
  {
    tr: "Bir arkadaşına son tatilini anlat.",
    en: "Tell a friend about your last holiday.",
    de: "Erzähl einer Freundin von deinem letzten Urlaub.",
  },
  {
    tr: "Günlüğüne bugün olan bir şeyi yaz.",
    en: "Write in your diary about something that happened today.",
    de: "Schreib in dein Tagebuch, was heute passiert ist.",
  },
  {
    tr: "Bir mağazada satıcıdan yardım iste.",
    en: "Ask a shop assistant for help.",
    de: "Bitte im Geschäft eine Verkäuferin um Hilfe.",
  },
  {
    tr: "Bir arkadaşına bir şey yapmayı öner.",
    en: "Suggest doing something to a friend.",
    de: "Schlag einem Freund vor, etwas zu unternehmen.",
  },
  {
    tr: "Yeni komşuna kendini kısaca tanıt.",
    en: "Briefly introduce yourself to your new neighbour.",
    de: "Stell dich deiner neuen Nachbarin kurz vor.",
  },
  {
    tr: "Bir iş görüşmesinde kendinden bahset.",
    en: "Talk about yourself in a job interview.",
    de: "Erzähl im Vorstellungsgespräch etwas über dich.",
  },
  {
    tr: "Bir arkadaşına neden geç kaldığını açıkla.",
    en: "Explain to a friend why you are late.",
    de: "Erklär einem Freund, warum du zu spät kommst.",
  },
];

// ------------------------------------------------------------
// Grammar goals — only ones at or below the learner's level are used.
// ------------------------------------------------------------
export const GRAMMAR_GOALS: GrammarGoal[] = [
  {
    id: "modalverb",
    name: "Modalverb",
    level: "A1",
    instruction: {
      tr: "Bir Modalverb kullan (können, müssen, wollen…)",
      en: "Use a Modalverb (können, müssen, wollen…)",
      de: "Benutze ein Modalverb (können, müssen, wollen…)",
    },
  },
  {
    id: "w-frage",
    name: "W-Frage",
    level: "A1",
    instruction: {
      tr: "Bir W-Frage kur (Wo, Wann, Warum…)",
      en: "Write a W-Frage (Wo, Wann, Warum…)",
      de: "Stell eine W-Frage (Wo, Wann, Warum…)",
    },
  },
  {
    id: "perfekt",
    name: "Perfekt",
    level: "A2",
    instruction: { tr: "Perfekt kullan", en: "Use the Perfekt", de: "Benutze das Perfekt" },
  },
  {
    id: "dativ",
    name: "Dativ",
    level: "A2",
    instruction: {
      tr: "Dativ isteyen bir yapı kullan (mit, bei, helfen…)",
      en: "Use something that takes the Dativ (mit, bei, helfen…)",
      de: "Benutze eine Konstruktion mit Dativ (mit, bei, helfen…)",
    },
  },
  {
    id: "weil",
    name: "Nebensatz mit „weil“",
    level: "A2",
    instruction: {
      tr: "„weil“ ile bir Nebensatz kur",
      en: "Write a Nebensatz with „weil“",
      de: "Bilde einen Nebensatz mit „weil“",
    },
  },
  {
    id: "dass",
    name: "Nebensatz mit „dass“",
    level: "B1",
    instruction: {
      tr: "„dass“ ile bir Nebensatz kur",
      en: "Write a Nebensatz with „dass“",
      de: "Bilde einen Nebensatz mit „dass“",
    },
  },
  {
    id: "praeteritum",
    name: "Präteritum",
    level: "B1",
    instruction: { tr: "Präteritum kullan", en: "Use the Präteritum", de: "Benutze das Präteritum" },
  },
  {
    id: "konjunktiv2",
    name: "Konjunktiv II",
    level: "B1",
    instruction: {
      tr: "Konjunktiv II kullan (würde, hätte, wäre…)",
      en: "Use Konjunktiv II (würde, hätte, wäre…)",
      de: "Benutze den Konjunktiv II (würde, hätte, wäre…)",
    },
  },
  {
    id: "relativsatz",
    name: "Relativsatz",
    level: "B1",
    instruction: {
      tr: "Bir Relativsatz kur",
      en: "Write a Relativsatz",
      de: "Bilde einen Relativsatz",
    },
  },
];

/** How often a task carries a grammar goal. */
export const GRAMMAR_GOAL_CHANCE = 0.4;

/**
 * Task size grows with success: start with one word, move to two after three
 * good sentences in a row, and to three after six. A sentence with a serious
 * error drops back to one word.
 *
 * `recent` holds first-try verdicts, newest first.
 */
export function wordCountFor(recent: Verdict[]): 1 | 2 | 3 {
  let streak = 0;
  for (const verdict of recent) {
    if (verdict === "major") break;
    streak += 1;
  }
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

const NEW_WORD_DAYS = 21;

/**
 * Picks the words for a task, in priority order:
 *   1. words due for review (most overdue first),
 *   2. recently learned words (added in the last three weeks, or still weak),
 *   3. any other word already studied at least once,
 *   4. as a last resort, words never studied yet.
 * Only words with a known meaning are used. Words from the previous task are
 * avoided when there are enough others.
 */
export function pickWords(
  words: Word[],
  count: number,
  options: { now?: Date; rng?: () => number; avoidIds?: string[] } = {}
): Word[] {
  const now = options.now ?? new Date();
  const rng = options.rng ?? Math.random;
  const avoid = new Set(options.avoidIds ?? []);

  const usable = words.filter((w) => w.enriched && !w.needs_review && w.term && w.meaning_tr);
  const fresh = usable.filter((w) => !avoid.has(w.id));
  const pool = fresh.length >= count ? fresh : usable;

  const shuffled = (list: Word[]) =>
    list
      .map((w) => ({ w, key: rng() }))
      .sort((a, b) => a.key - b.key)
      .map(({ w }) => w);

  const studied = pool.filter((w) => w.last_reviewed !== null);
  const isDue = (w: Word) => new Date(w.next_review) <= now;
  const isRecent = (w: Word) =>
    now.getTime() - new Date(w.created_at).getTime() < NEW_WORD_DAYS * 86_400_000 || w.mastery < 50;

  const due = studied
    .filter(isDue)
    .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime());
  const recent = shuffled(studied.filter((w) => !isDue(w) && isRecent(w)));
  const other = shuffled(studied.filter((w) => !isDue(w) && !isRecent(w)));
  const neverStudied = shuffled(pool.filter((w) => w.last_reviewed === null));

  return [...due, ...recent, ...other, ...neverStudied].slice(0, count);
}

/** Picks a situation and, sometimes, a grammar goal suited to the learner's level. */
export function pickPrompt(
  level: Level,
  locale: Locale,
  rng: () => number = Math.random
): Pick<SentenceTask, "context" | "grammarGoal"> {
  const context = CONTEXTS[Math.floor(rng() * CONTEXTS.length)][locale];
  const goals = GRAMMAR_GOALS.filter((g) => LEVEL_ORDER[g.level] <= LEVEL_ORDER[level]);
  if (goals.length === 0 || rng() >= GRAMMAR_GOAL_CHANCE) return { context, grammarGoal: null };
  const goal = goals[Math.floor(rng() * goals.length)];
  return { context, grammarGoal: { id: goal.id, name: goal.name, instruction: goal.instruction[locale] } };
}

export function toTaskWord(w: Word): TaskWord {
  return {
    id: w.id,
    term: w.term,
    article: w.article,
    meaning_tr: w.meaning_tr,
    part_of_speech: w.part_of_speech,
  };
}
