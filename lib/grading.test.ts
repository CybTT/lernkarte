import { describe, expect, it } from "vitest";
import { requestGrade } from "./grading";

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), { status })) as typeof fetch;
}

describe("requestGrade", () => {
  it("returns the verdict on success", async () => {
    const out = await requestGrade("Haus", "ev", "ev", fakeFetch(200, { correct: true, feedback: "Doğru" }));
    expect(out).toEqual({ status: "ok", correct: true, feedback: "Doğru" });
  });

  it.each([
    ["server error", fakeFetch(502, { error: "x" })],
    ["rate limit / no credit", fakeFetch(429, { error: "x" })],
    ["malformed body", fakeFetch(200, "not json")],
    ["missing verdict", fakeFetch(200, { feedback: "?" })],
    ["network failure", (async () => { throw new TypeError("offline"); }) as typeof fetch],
  ])("treats %s as 'could not grade', never as wrong", async (_label, f) => {
    expect(await requestGrade("Haus", "ev", "ev", f)).toEqual({ status: "failed" });
  });
});
