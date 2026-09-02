/**
 * Seeds `dictionary_pool` with the Goethe-Institut A1/A2/B1 Wortliste.
 *
 * Source: https://github.com/ilkermeliksitki/goethe-institute-wordlist
 * (the official Goethe-Institut exam word lists transcribed to TSV, one file
 * per letter per level, columns: word / German example / English translation).
 *
 * The pool is reference data used only to draw multiple-choice distractors,
 * so we keep just what distractor picking needs: term, article, plural hint,
 * part of speech, level, and the example sentence.
 *
 *   npx tsx scripts/seed-dictionary-pool.ts --dry-run   # parse + report only
 *   npx tsx scripts/seed-dictionary-pool.ts             # write to Supabase
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Article, DictionaryPoolEntry, Level } from "../lib/types";

const REPO_RAW = "https://raw.githubusercontent.com/ilkermeliksitki/goethe-institute-wordlist/master";
const REPO_API = "https://api.github.com/repos/ilkermeliksitki/goethe-institute-wordlist/contents";
const LEVELS: { dir: string; level: Level }[] = [
  { dir: "a1", level: "A1" },
  { dir: "a2", level: "A2" },
  { dir: "b1", level: "B1" },
];

type ParsedEntry = Omit<DictionaryPoolEntry, "id">;

const ADJECTIVE_SUFFIXES = ["ig", "lich", "isch", "bar", "sam", "los", "haft", "voll", "arm"];
const VERB_SUFFIXES = ["en", "ern", "eln"];

/** Splits "der Laden, -ä" into { article: "der", term: "Laden", plural_hint: "-ä" }. */
export function parseTerm(raw: string): {
  term: string;
  article: Article | null;
  plural_hint: string | null;
} {
  // Drop homonym markers: "abholen(1)" -> "abholen"
  let text = raw.replace(/\(\d+\)\s*$/, "").trim();
  // Drop annotations: "Lebensmittel (pl.)" -> "Lebensmittel"
  text = text.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();

  let article: Article | null = null;
  const withArticle = text.match(/^(der|die|das)\s+(.+)$/);
  if (withArticle) {
    article = withArticle[1] as Article;
    text = withArticle[2].trim();
  }

  // Spelling variants are listed together: "gern/gerne", "circa/ca." -> keep the first.
  if (text.includes("/")) {
    text = text.split("/")[0].trim();
  }

  // Everything after the first comma is a plural/inflection hint: "Laden, -ä"
  let plural_hint: string | null = null;
  const commaIndex = text.indexOf(",");
  if (commaIndex !== -1) {
    plural_hint = text.slice(commaIndex + 1).trim() || null;
    text = text.slice(0, commaIndex).trim();
  }

  // Adjective stems are listed as "letzt-", "lieb-"
  text = text.replace(/-$/, "").trim();

  return { term: text, article, plural_hint };
}

export function inferPartOfSpeech(
  term: string,
  article: Article | null,
  rawTerm: string
): ParsedEntry["part_of_speech"] {
  if (article) return "noun";
  const lower = term.toLowerCase();
  if (VERB_SUFFIXES.some((s) => lower.endsWith(s))) return "verb";
  if (rawTerm.trim().endsWith("-")) return "adjective";
  if (ADJECTIVE_SUFFIXES.some((s) => lower.endsWith(s))) return "adjective";
  // Capitalised words are nouns in German even when the list omits the article.
  if (/^[A-ZÄÖÜ]/.test(term)) return "noun";
  return "other";
}

function parseLine(line: string, level: Level): ParsedEntry | null {
  const parts = line.replace(/\r$/, "").split("\t");
  const raw = parts[0]?.trim();
  if (!raw || raw === "german word") return null;

  const { term, article, plural_hint } = parseTerm(raw);
  if (!term) return null;
  // Multi-word phrases ("ab und zu") make poor single-word distractors.
  if (term.includes(" ")) return null;
  // Suffix/prefix fragments ("-weise", "-Karte") aren't words on their own.
  if (term.startsWith("-")) return null;

  return {
    term,
    article,
    plural_hint,
    part_of_speech: inferPartOfSpeech(term, article, raw),
    level,
    example_de: parts[1]?.trim() || null,
  };
}

async function listTsvFiles(dir: string): Promise<string[]> {
  const res = await fetch(`${REPO_API}/${dir}`);
  if (!res.ok) throw new Error(`Could not list ${dir}: ${res.status} ${res.statusText}`);
  const files = (await res.json()) as { name: string }[];
  return files.filter((f) => f.name.endsWith(".tsv")).map((f) => f.name);
}

export async function collectEntries(): Promise<ParsedEntry[]> {
  // Lowest level wins, so a word introduced at A1 isn't relabelled B1.
  const byTerm = new Map<string, ParsedEntry>();

  for (const { dir, level } of LEVELS) {
    const files = await listTsvFiles(dir);
    for (const file of files) {
      const res = await fetch(`${REPO_RAW}/${dir}/${file}`);
      if (!res.ok) throw new Error(`Could not fetch ${dir}/${file}: ${res.status}`);
      const text = await res.text();
      for (const line of text.split("\n")) {
        const entry = parseLine(line, level);
        if (!entry) continue;
        const key = entry.term.toLowerCase();
        const existing = byTerm.get(key);
        if (!existing) {
          byTerm.set(key, entry);
        } else if (!existing.article && entry.article) {
          // Prefer the record that carries an article, keeping the lower level.
          byTerm.set(key, { ...entry, level: existing.level });
        }
      }
    }
  }

  return [...byTerm.values()].sort((a, b) => a.term.localeCompare(b.term, "de"));
}

function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function report(entries: ParsedEntry[]) {
  const byLevel = new Map<string, number>();
  const byPos = new Map<string, number>();
  for (const e of entries) {
    byLevel.set(e.level, (byLevel.get(e.level) ?? 0) + 1);
    byPos.set(e.part_of_speech, (byPos.get(e.part_of_speech) ?? 0) + 1);
  }

  console.log(`\nToplam benzersiz kelime: ${entries.length}`);
  console.log("Seviye:", Object.fromEntries([...byLevel].sort()));
  console.log("Kelime türü:", Object.fromEntries([...byPos].sort()));

  const nouns = entries.filter((e) => e.article);
  console.log(`\nArtikelli isim: ${nouns.length}`);
  console.log("\n--- Örnek isimler (artikel kontrolü için) ---");
  for (const e of nouns.slice(0, 12)) {
    console.log(
      `  ${e.article} ${e.term}${e.plural_hint ? ` (pl. ${e.plural_hint})` : ""}  [${e.level}]`
    );
  }
  const known = ["Haus", "Frau", "Mann", "Buch", "Auto", "Stadt", "Zeit", "Kind", "Wasser", "Straße"];
  console.log("\n--- Bilinen kelimelerde artikel doğruluğu ---");
  for (const term of known) {
    const found = entries.find((e) => e.term === term);
    console.log(found ? `  ${found.article ?? "(artikel yok)"} ${found.term}  [${found.level}]` : `  ${term}: bulunamadı`);
  }
  console.log("\n--- Örnek fiiller ---");
  console.log(
    "  " + entries.filter((e) => e.part_of_speech === "verb").slice(0, 10).map((e) => e.term).join(", ")
  );
  console.log("--- Örnek sıfatlar ---");
  console.log(
    "  " + entries.filter((e) => e.part_of_speech === "adjective").slice(0, 10).map((e) => e.term).join(", ")
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log("Goethe A1/A2/B1 Wortliste indiriliyor…");
  const entries = await collectEntries();
  report(entries);

  if (dryRun) {
    console.log("\n[--dry-run] Veritabanına hiçbir şey yazılmadı.");
    return;
  }

  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const BATCH = 500;
  let written = 0;
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const { error } = await supabase.from("dictionary_pool").upsert(batch, { onConflict: "term" });
    if (error) throw new Error(`Batch ${i / BATCH + 1} failed: ${error.message}`);
    written += batch.length;
    console.log(`  ${written}/${entries.length} yazıldı`);
  }

  // Drop rows from earlier runs whose terms the parser no longer produces,
  // so re-seeding converges on exactly the current list.
  const wanted = new Set(entries.map((e) => e.term));
  const stale: string[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("dictionary_pool")
      .select("term")
      .range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    stale.push(...data.map((r) => r.term as string).filter((t) => !wanted.has(t)));
    if (data.length < PAGE) break;
  }
  if (stale.length > 0) {
    const { error } = await supabase.from("dictionary_pool").delete().in("term", stale);
    if (error) throw new Error(`Cleanup failed: ${error.message}`);
    console.log(`  ${stale.length} eskimiş satır silindi`);
  }

  const { count } = await supabase
    .from("dictionary_pool")
    .select("*", { count: "exact", head: true });
  console.log(`\nBitti. dictionary_pool tablosunda ${count} satır var.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
