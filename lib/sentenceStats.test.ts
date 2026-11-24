import { describe, expect, it } from "vitest";
import { computeSentenceStats, weekStartOf, type AttemptRow } from "./sentenceStats";

const NOW = new Date("2026-11-25T10:00:00Z"); // Wednesday

const row = (created_at: string, verdict: AttemptRow["verdict"], error_types: string[] = []): AttemptRow => ({
  created_at,
  verdict,
  error_types,
});

describe("weekStartOf", () => {
  it("finds the Monday of the week", () => {
    expect(weekStartOf("2026-11-25")).toBe("2026-11-23");
    expect(weekStartOf("2026-11-23")).toBe("2026-11-23");
    expect(weekStartOf("2026-11-29")).toBe("2026-11-23"); // Sunday
  });
});

describe("computeSentenceStats", () => {
  it("is empty without sentences", () => {
    const s = computeSentenceStats([], NOW, 4);
    expect(s).toMatchObject({ sentences: 0, correctRate: null, errorsPerSentence: null, byType: [] });
    expect(s.weeks).toHaveLength(4);
  });

  it("totals, ranks error types and splits by week", () => {
    const s = computeSentenceStats(
      [
        row("2026-11-24T09:00:00Z", "correct"),
        row("2026-11-24T10:00:00Z", "major", ["kasus", "artikel"]),
        row("2026-11-17T10:00:00Z", "minor", ["kasus"]),
        row("2026-11-16T22:30:00Z", "minor", ["unknown-type"]), // Tue 01:30 in Istanbul
      ],
      NOW,
      3
    );
    expect(s.sentences).toBe(4);
    expect(s.correctRate).toBe(0.25);
    expect(s.byType).toEqual([
      { type: "kasus", count: 2 },
      { type: "artikel", count: 1 },
    ]);
    expect(s.weeks.map((w) => [w.weekStart, w.sentences])).toEqual([
      ["2026-11-09", 0],
      ["2026-11-16", 2],
      ["2026-11-23", 2],
    ]);
    expect(s.weeks[2]).toMatchObject({ correctRate: 0.5, errorsPerSentence: 1 });
  });
});
