import { NextResponse, type NextRequest } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/route";
import { gradeAnswer } from "@/lib/anthropic";
import { aiUnavailable } from "@/lib/aiResponse";

export async function POST(request: NextRequest) {
  const { user } = await getRouteSupabase(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { term, expected_meaning, answer } = body ?? {};
  if (
    typeof term !== "string" ||
    typeof expected_meaning !== "string" ||
    typeof answer !== "string" ||
    !term ||
    !expected_meaning ||
    answer.length > 500
  ) {
    return NextResponse.json(
      { error: "term, expected_meaning and answer are required" },
      { status: 400 }
    );
  }

  try {
    const result = await gradeAnswer(term, expected_meaning, answer);
    if (typeof result?.correct !== "boolean") throw new Error("Malformed grade result");
    return NextResponse.json(result);
  } catch (err) {
    return aiUnavailable(err, "grade");
  }
}
