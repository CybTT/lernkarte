/**
 * Re-runs enrichment over stored words so they satisfy the current rules:
 * `term` is a clean German lemma, meanings carry no explanatory prose, and
 * usage notes / extra meanings are filled in.
 *
 * Rows written before those rules existed can hold things like a term of
 * "kedi" with a meaning of "kedi (Türkçe kelime — Almanca karşılığı: die
 * Katze)". `--broken-only` targets exactly those; with no flag every word is
 * refreshed.
 *
 *   npx tsx scripts/repair-words.ts --dry-run        # report only
 *   npx tsx scripts/repair-words.ts --broken-only    # fix suspect rows
 *   npx tsx scripts/repair-words.ts                  # refresh every row
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { enrichWordRows, type EnrichableRow } from "../lib/enrichment";
import { isCleanGermanTerm } from "../lib/germanTerm";

interface WordRow extends EnrichableRow {
  meaning_tr: string | null;
  usage_note: string | null;
  meanings_tr: string[] | null;
}

/** Heuristics for rows produced before the term/meaning rules were enforced. */
function looksBroken(row: WordRow): boolean {
  if (!isCleanGermanTerm(row.term)) return true;
  const meaning = row.meaning_tr ?? "";
  // A meaning should be a short gloss, never a note about the input.
  if (/[()]|Türkçe|Almanca karşılığı|=/.test(meaning)) return true;
  if (meaning.length > 60) return true;
  // Enriched before usage_note existed.
  if (row.usage_note === null) return true;
  return false;
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const file = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  for (const line of file.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const brokenOnly = process.argv.includes("--broken-only");

  const env = loadEnv();
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("words")
    .select("id, term, original_input, context_sentence, meaning_tr, usage_note, meanings_tr");
  if (error) throw new Error(error.message);

  const all = (data ?? []) as WordRow[];
  const targets = brokenOnly ? all.filter(looksBroken) : all;

  console.log(`Toplam kelime: ${all.length}`);
  console.log(`Onarılacak:    ${targets.length}${brokenOnly ? " (--broken-only)" : ""}\n`);
  for (const row of targets) {
    console.log(`  "${row.term}"  anlam: ${JSON.stringify(row.meaning_tr)}`);
  }

  if (dryRun) {
    console.log("\n[--dry-run] Hiçbir şey değiştirilmedi.");
    return;
  }
  if (targets.length === 0) return;

  console.log("\nYeniden zenginleştiriliyor…");
  const reports = await enrichWordRows(supabase, targets);

  console.log("\nSonuç:");
  for (const r of reports) {
    if (r.needs_review) {
      console.log(`  "${r.input}" → tanınmadı, needs_review işaretlendi`);
    } else if (r.corrected) {
      console.log(`  "${r.input}" → "${r.term}" olarak düzeltildi`);
    } else {
      console.log(`  "${r.term}" güncellendi`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
