import { NextResponse, type NextRequest } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/route";
import { enrichWordRows, type EnrichableRow } from "@/lib/enrichment";

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

  let query = supabase
    .from("words")
    .select("id, term, original_input, context_sentence")
    .in("id", wordIds);
  if (!force) query = query.eq("enriched", false);
  const { data: rows, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ enriched: [], results: [] });
  }

  let reports;
  try {
    reports = await enrichWordRows(supabase, rows as EnrichableRow[]);
  } catch (err) {
    return NextResponse.json(
      { error: `Enrichment failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    enriched: reports.filter((r) => !r.needs_review).map((r) => r.id),
    results: reports,
  });
}
