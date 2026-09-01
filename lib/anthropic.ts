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

For each German word (a base lemma, given with optional surrounding-sentence context), produce enrichment data as strict JSON. Rules:
- Output ONLY a JSON object (or array, for batches) — no markdown fences, no prose before or after.
- "article": "der" | "die" | "das" for nouns, or null for non-nouns.
- "plural": the plural form for nouns (German convention, e.g. "Häuser"), or null for non-nouns.
- "part_of_speech": one of "noun" | "verb" | "adjective" | "adverb" | "other".
- "meaning_tr": the primary Turkish meaning, concise (a word or short phrase, not a full sentence).
- "meaning_en": the English meaning, same style.
- "ipa": IPA pronunciation of the German word (no slashes/brackets).
- "example_de": one natural B1-level German example sentence using the word.
- "example_tr": the Turkish translation of that example sentence.
- "praeteritum": for verbs, the Präteritum (simple past) 3rd person singular form; otherwise null.
- "perfekt": for verbs, the Perfekt form (e.g. "ist gegangen", "hat gemacht"); otherwise null.
- "separable": for verbs, true if separable (e.g. "ankommen"), false if not, null for non-verbs.
- "rektion": for verbs/adjectives that govern a preposition or case, e.g. "warten auf + Akk"; otherwise null.
- "word_family": an array of 2-5 related German words sharing the root (e.g. for "fahren": ["Fahrt","Fahrer","erfahren"]).
- "theme": a short thematic cluster label in German, e.g. "Verkehr", "Wohnen", "Arbeit".

When given a single word, return one JSON object with these fields plus "term" echoing the input term.
When given multiple words, return a JSON array of such objects, one per input term, in the same order, each including "term".`;

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
 */
export async function enrichWords(
  items: EnrichInput[]
): Promise<Record<string, EnrichmentResult>> {
  if (items.length === 0) return {};

  const client = getAnthropicClient();
  const maxTokens = Math.min(4096, Math.max(600, items.length * 350));

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
  const byTerm: Record<string, EnrichmentResult> = {};
  for (const entry of results) {
    if (entry && typeof entry === "object" && "term" in entry) {
      const { term, ...rest } = entry as { term: string } & EnrichmentResult;
      byTerm[term] = rest as EnrichmentResult;
    }
  }
  return byTerm;
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
