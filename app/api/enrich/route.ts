import { NextResponse, type NextRequest } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/route";
import { enrichWords } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const { supabase, user } = await getRouteSupabase(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const wordIds: string[] | undefined = body?.word_ids;
  const force = body?.force === true;
  if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
    return NextResponse.json({ error: "word_ids is required" }, { status: 400 });
  }

  let query = supabase.from("words").select("id, term, context_sentence").in("id", wordIds);
  if (!force) query = query.eq("enriched", false);
  const { data: rows, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ enriched: [] });
  }

  let byTerm;
  try {
    byTerm = await enrichWords(
      rows.map((r) => ({ term: r.term, context_sentence: r.context_sentence }))
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Enrichment failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  const enrichedIds: string[] = [];
  for (const row of rows) {
    const result = byTerm[row.term];
    if (!result) continue;

    const { error: updateError } = await supabase
      .from("words")
      .update({
        enriched: true,
        article: result.article,
        plural: result.plural,
        part_of_speech: result.part_of_speech,
        meaning_tr: result.meaning_tr,
        meaning_en: result.meaning_en,
        ipa: result.ipa,
        example_de: result.example_de,
        example_tr: result.example_tr,
        praeteritum: result.praeteritum,
        perfekt: result.perfekt,
        separable: result.separable,
        rektion: result.rektion,
        word_family: result.word_family,
        theme: result.theme,
      })
      .eq("id", row.id);

    if (!updateError) enrichedIds.push(row.id);
  }

  return NextResponse.json({ enriched: enrichedIds });
}
