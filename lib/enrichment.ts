import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichWords } from "./anthropic";
import { normalizeTerm } from "./germanTerm";
import type { EnrichmentResult } from "./types";

export interface EnrichableRow {
  id: string;
  term: string;
  original_input: string | null;
  context_sentence: string | null;
}

export interface EnrichedWordReport {
  id: string;
  /** What the user originally submitted. */
  input: string;
  /** The clean German term actually stored. */
  term: string;
  /** True when the stored term differs from the input (e.g. "araba" -> "Auto"). */
  corrected: boolean;
  needs_review: boolean;
}

function enrichedUpdate(
  result: EnrichmentResult,
  term: string,
  article: EnrichmentResult["article"],
  originalInput: string | null
) {
  return {
    term,
    original_input: originalInput,
    needs_review: false,
    enriched: true,
    article,
    plural: result.plural,
    part_of_speech: result.part_of_speech,
    meaning_tr: result.meaning_tr,
    meaning_en: result.meaning_en,
    meanings_tr: result.meanings_tr ?? [],
    usage_note: result.usage_note,
    ipa: result.ipa,
    example_de: result.example_de,
    example_tr: result.example_tr,
    praeteritum: result.praeteritum,
    perfekt: result.perfekt,
    separable: result.separable,
    rektion: result.rektion,
    word_family: result.word_family,
    theme: result.theme,
  };
}

/**
 * Enriches rows in place, guaranteeing `term` ends up a clean German lemma.
 *
 * The model is asked to resolve non-German input (the learner typing Turkish)
 * to the German word; anything it can't identify is flagged `needs_review`
 * rather than written as invented data — corrupt rows like a term of
 * "kedi (Türkçe kelime — Almanca karşılığı: die Katze)" came from doing
 * otherwise.
 */
export async function enrichWordRows(
  supabase: SupabaseClient,
  rows: EnrichableRow[]
): Promise<EnrichedWordReport[]> {
  if (rows.length === 0) return [];

  // Re-enrichment resolves what the user originally typed, not the term a
  // previous (possibly wrong) run stored.
  const inputFor = new Map(rows.map((r) => [r.id, r.original_input || r.term]));

  const byInput = await enrichWords(
    rows.map((r) => ({
      term: inputFor.get(r.id)!,
      context_sentence: r.context_sentence,
    }))
  );

  const reports: EnrichedWordReport[] = [];
  for (const row of rows) {
    const input = inputFor.get(row.id)!;
    const result = byInput[input];

    const normalized =
      result && result.input_status !== "unknown" && result.term
        ? normalizeTerm(result.term, result.part_of_speech, result.article)
        : null;

    if (!normalized) {
      await supabase
        .from("words")
        .update({ enriched: false, needs_review: true })
        .eq("id", row.id);
      reports.push({ id: row.id, input, term: row.term, corrected: false, needs_review: true });
      continue;
    }

    const corrected = normalized.term !== input;
    const { error } = await supabase
      .from("words")
      .update(enrichedUpdate(result, normalized.term, normalized.article, corrected ? input : null))
      .eq("id", row.id);

    if (!error) {
      reports.push({
        id: row.id,
        input,
        term: normalized.term,
        corrected,
        needs_review: false,
      });
    }
  }

  return reports;
}
