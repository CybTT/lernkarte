import Anthropic from "@anthropic-ai/sdk";
import type { EnrichmentResult } from "./types";

// Explicit per the product spec: a personal, free-tier app where prompt
// caching is the main cost lever, so we deliberately don't reach for the
// top-tier model here.
export const MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;
export function getAnthropicClient(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

/** Strips a stray ```json fence or leading/trailing prose Claude sometimes adds. */
export function extractJson(raw: string): string {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf(text.trimStart()[0] === "[" ? "[" : "{");
  const end = text.trimStart()[0] === "[" ? text.lastIndexOf("]") : text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  return text;
}

const ENRICHMENT_SYSTEM_PROMPT = `You are a German lexicographer helping a Turkish speaker studying for the B1 Zertifikat Deutsch.

The learner types words into a vocabulary app. The input may be German, but it may also be Turkish (they typed their own language), misspelled, or nonsense. Your job is to resolve it to ONE German word and describe that word.

## The single most important rule
"term" MUST be one clean German lemma and nothing else: letters only (hyphen allowed for real compounds like "E-Mail"). NEVER put an explanation, a translation note, a parenthetical, a slash alternative, an article, or punctuation in "term". If the input was Turkish, "term" is the GERMAN word — not the Turkish one.
Correct: "Auto", "Katze", "gehen", "schnell", "E-Mail"
Forbidden: "araba", "das Auto", "Auto/Wagen", "kedi (Almanca: Katze)", "araba = otomobil"

## Fields
- "input_status": "german" if the input already was a German word; "translated" if the input was Turkish (or another language) and you resolved it to a German word; "unknown" if it is not a recognisable word in either language (typo, gibberish).
- "term": the clean German lemma (see the rule above). Nouns capitalised, verbs in the infinitive. For "unknown", set this to null.
- "article": "der" | "die" | "das" for nouns, or null for non-nouns.
- "plural": the plural form for nouns (e.g. "Häuser"), or null for non-nouns.
- "part_of_speech": one of "noun" | "verb" | "adjective" | "adverb" | "other".
- "meaning_tr": the primary Turkish meaning ONLY — a word or short phrase. Never a sentence, never a note about the input, never parentheses explaining what language something is.
- "meanings_tr": an array of ADDITIONAL distinct Turkish meanings this word commonly has, most common first, excluding the primary one. Empty array if the word really has just one meaning. Keep each entry short.
- "meaning_en": the English meaning, same concise style.
- "usage_note": one short Turkish sentence (max ~15 words) on how or where this word is used in everyday life — register, typical context, or a common collocation. Practical, not encyclopaedic. Example for "Feierabend": "İş çıkışı/mesai sonrası için günlük konuşmada çok sık kullanılır."
- "ipa": IPA pronunciation of the GERMAN word (no slashes/brackets).
- "example_de": one natural B1-level German example sentence using the word.
- "example_tr": the Turkish translation of that example sentence.
- "praeteritum": for verbs, the Präteritum 3rd person singular; otherwise null.
- "perfekt": for verbs, the Perfekt form (e.g. "ist gegangen"); otherwise null.
- "separable": for verbs, true if separable (e.g. "ankommen"), false if not, null for non-verbs.
- "rektion": for verbs/adjectives governing a preposition or case, e.g. "warten auf + Akk"; otherwise null.
- "word_family": 2-5 related German words sharing the root (e.g. for "fahren": ["Fahrt","Fahrer","erfahren"]).
- "theme": a short thematic label in German, e.g. "Verkehr", "Wohnen", "Arbeit".

For "unknown" input, set "term" to null and every other field to null or [] — do not invent a word.

## Output
Output ONLY JSON — no markdown fences, no prose.
Single input: one JSON object with all fields plus "input" echoing the exact input string you were given.
Multiple inputs: a JSON array of such objects, one per input, in the same order, each including "input".`;

interface EnrichInput {
  term: string;
  context_sentence?: string | null;
}

function userContentFor(items: EnrichInput[]): string {
  if (items.length === 1) {
    const { term, context_sentence } = items[0];
    return context_sentence
      ? `Word: ${term}\nContext sentence: ${context_sentence}`
      : `Word: ${term}`;
  }
  return items
    .map((item, i) =>
      item.context_sentence
        ? `${i + 1}. Word: ${item.term}\n   Context: ${item.context_sentence}`
        : `${i + 1}. Word: ${item.term}`
    )
    .join("\n");
}

/**
 * Enrich one or more words in a single call. The long rules/schema prompt is
 * cached (`cache_control: ephemeral`); only the word list varies per call.
 *
 * Keyed by the *input* string rather than the resulting term, because
 * enrichment may rewrite the term (Turkish "araba" -> German "Auto").
 */
export async function enrichWords(
  items: EnrichInput[]
): Promise<Record<string, EnrichmentResult>> {
  if (items.length === 0) return {};

  const client = getAnthropicClient();
  const maxTokens = Math.min(8192, Math.max(800, items.length * 450));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: ENRICHMENT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContentFor(items) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Enrichment response had no text content");
  }

  const json = extractJson(textBlock.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Failed to parse enrichment JSON: ${(err as Error).message}\nRaw: ${json}`);
  }

  const results = Array.isArray(parsed) ? parsed : [parsed];
  const byInput: Record<string, EnrichmentResult> = {};
  for (const [index, entry] of results.entries()) {
    if (!entry || typeof entry !== "object") continue;
    const { input, ...rest } = entry as { input?: string } & EnrichmentResult;
    // Fall back to positional matching if the model dropped the echo field.
    const key = input ?? items[index]?.term;
    if (key) byInput[key] = rest as EnrichmentResult;
  }
  return byInput;
}

const SENTENCE_SYSTEM_PROMPT = `You write a single natural B1-level German sentence for a Turkish learner, using ONLY the target word plus words from a provided "known words" list (articles, pronouns, conjunctions, and common function words are always allowed even if not listed). Keep the sentence comprehensible and short (max ~12 words).

Output ONLY strict JSON: {"example_de": "...", "example_tr": "..."} — no markdown, no prose.`;

export async function generateSentence(
  targetWord: string,
  knownWords: string[]
): Promise<{ example_de: string; example_tr: string }> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: [
      { type: "text", text: SENTENCE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `Target word: ${targetWord}\nKnown words: ${knownWords.join(", ") || "(none yet)"}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Sentence response had no text content");
  }
  return JSON.parse(extractJson(textBlock.text));
}

const GRADE_SYSTEM_PROMPT = `You grade a B1 German learner's free-text answer for semantic correctness, not exact wording. Given the target German word/phrase, its expected meaning, and the learner's answer, decide if the answer correctly conveys that meaning (minor spelling/grammar slips are fine; wrong meaning is not).

Output ONLY strict JSON: {"correct": true|false, "feedback": "one short sentence in Turkish"} — no markdown, no prose.`;

export async function gradeAnswer(
  term: string,
  expectedMeaning: string,
  userAnswer: string
): Promise<{ correct: boolean; feedback: string }> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: [{ type: "text", text: GRADE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Word: ${term}\nExpected meaning: ${expectedMeaning}\nLearner's answer: ${userAnswer}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Grade response had no text content");
  }
  return JSON.parse(extractJson(textBlock.text));
}
