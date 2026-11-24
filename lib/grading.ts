/**
 * Result of asking the server to grade a free-text answer. Only "ok" carries
 * a verdict; "failed" means "we don't know", and must never be
 * recorded as a wrong answer.
 */
export type GradeOutcome =
  | { status: "ok"; correct: boolean; feedback: string }
  | { status: "failed" };

export async function requestGrade(
  term: string,
  expectedMeaning: string,
  answer: string,
  fetchImpl: typeof fetch = fetch
): Promise<GradeOutcome> {
  try {
    const res = await fetchImpl("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term, expected_meaning: expectedMeaning, answer }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || typeof data?.correct !== "boolean") return { status: "failed" };
    return {
      status: "ok",
      correct: data.correct,
      feedback: typeof data.feedback === "string" ? data.feedback : "",
    };
  } catch {
    return { status: "failed" };
  }
}
