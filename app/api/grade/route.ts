import { NextResponse, type NextRequest } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/route";
import { gradeAnswer } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const { user } = await getRouteSupabase(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { term, expected_meaning, answer } = body ?? {};
  if (!term || !expected_meaning || typeof answer !== "string") {
    return NextResponse.json(
      { error: "term, expected_meaning and answer are required" },
      { status: 400 }
    );
  }

  try {
    const result = await gradeAnswer(term, expected_meaning, answer);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
