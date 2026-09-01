import { NextResponse, type NextRequest } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/route";
import { generateSentence } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const { supabase, user } = await getRouteSupabase(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const targetWord: string | undefined = body?.target_word;
  if (!targetWord) {
    return NextResponse.json({ error: "target_word is required" }, { status: 400 });
  }

  const { data: known } = await supabase
    .from("words")
    .select("term")
    .eq("user_id", user.id)
    .gte("mastery", 60)
    .neq("term", targetWord);

  try {
    const result = await generateSentence(
      targetWord,
      (known ?? []).map((w) => w.term)
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
