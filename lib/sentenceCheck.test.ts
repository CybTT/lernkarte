import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { checkSentence, normalizeEvaluation, wordUsedCorrectly, type CheckInput } from "./sentenceCheck";

const SENTENCE = "Ich habe gestern mit meine Freund Fußball gespielt.";

function rawEvaluation(over: Record<string, unknown> = {}) {
  return {
    verdict: "major",
    praise: "Perfekt doğru kurulmuş.",
    corrected: "Ich habe gestern mit meinem Freund Fußball gespielt.",
    errors: [
      {
        fragment: "meine",
        type: "kasus",
        correction: "meinem",
        explanation: "„mit“ Dativ ister.",
        rule: "mit + Dativ",
      },
    ],
    target_words: [
      { term: "Freund", used: true, correct_meaning: true, correct_form: false, note: "Dativ olmalı" },
    ],
    suggestion: "",
    grammar_goal: "met",
    grammar_goal_note: "Perfekt kullanılmış.",
    ...over,
  };
}

describe("normalizeEvaluation", () => {
  it("accepts a well-formed evaluation and locates each error in the sentence", () => {
    const e = normalizeEvaluation(rawEvaluation(), SENTENCE, ["Freund"])!;
    expect(e.verdict).toBe("major");
    expect(e.errors[0]).toMatchObject({ fragment: "meine", type: "kasus", located: true });
    expect(e.targetWords[0]).toMatchObject({ term: "Freund", correctForm: false });
    expect(wordUsedCorrectly(e.targetWords[0])).toBe(false);
    expect(e.suggestion).toBeNull(); // empty string means no suggestion
    expect(e.grammarGoalMet).toBe(true);
  });

  it("never calls a sentence without errors anything but correct", () => {
    const e = normalizeEvaluation(
      rawEvaluation({ verdict: "minor", errors: [], corrected: "something else" }),
      SENTENCE,
      ["Freund"]
    )!;
    expect(e.verdict).toBe("correct");
    expect(e.corrected).toBe(SENTENCE);
  });

  it("never calls a sentence with listed errors correct", () => {
    expect(normalizeEvaluation(rawEvaluation({ verdict: "correct" }), SENTENCE, ["Freund"])!.verdict).toBe(
      "minor"
    );
  });

  it("drops a 'suggestion' that only repeats the sentence or the correction", () => {
    const e = normalizeEvaluation(
      rawEvaluation({ suggestion: "Ich habe gestern mit meinem Freund Fußball gespielt." }),
      SENTENCE,
      ["Freund"]
    )!;
    expect(e.suggestion).toBeNull();
  });

  it("marks errors whose fragment isn't in the sentence as not highlightable", () => {
    const raw = rawEvaluation();
    (raw.errors as { fragment: string }[])[0].fragment = "meinen";
    expect(normalizeEvaluation(raw, SENTENCE, ["Freund"])!.errors[0].located).toBe(false);
  });

  it("treats an unused target word as wrong in meaning and form", () => {
    const e = normalizeEvaluation(
      rawEvaluation({
        target_words: [{ term: "Freund", used: false, correct_meaning: true, correct_form: true, note: "" }],
      }),
      SENTENCE,
      ["Freund"]
    )!;
    expect(e.targetWords[0]).toMatchObject({ used: false, correctMeaning: false, correctForm: false });
  });

  it.each([
    ["not an object", "oops"],
    ["unknown verdict", rawEvaluation({ verdict: "perfect" })],
    ["unknown error type", rawEvaluation({ errors: [{ ...rawEvaluation().errors[0], type: "tense" }] })],
    ["missing target word", rawEvaluation({ target_words: [] })],
  ])("rejects %s", (_label, raw) => {
    expect(normalizeEvaluation(raw, SENTENCE, ["Freund"])).toBeNull();
  });
});

describe("checkSentence", () => {
  const input: CheckInput = {
    sentence: SENTENCE,
    targetWords: [{ term: "Freund", article: "der", meaning: "arkadaş" }],
    context: "Bir arkadaşına son tatilini anlat.",
    grammarGoal: "Perfekt",
    level: "A2",
    locale: "tr",
  };

  function fakeClient(texts: string[]) {
    const create = vi.fn();
    for (const text of texts) {
      create.mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [{ type: "text", text }],
      });
    }
    return { client: { messages: { create } } as unknown as Pick<Anthropic, "messages">, create };
  }

  it("asks once more, silently, when the first answer is broken", async () => {
    const { client, create } = fakeClient(["{not json", JSON.stringify(rawEvaluation())]);
    const e = await checkSentence(input, client);
    expect(e.verdict).toBe("major");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("gives up after a second broken answer", async () => {
    const { client, create } = fakeClient(["{not json", JSON.stringify({ verdict: "?" })]);
    await expect(checkSentence(input, client)).rejects.toThrow();
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("sends the learner's sentence, level, goal and feedback language", async () => {
    const { client, create } = fakeClient([JSON.stringify(rawEvaluation())]);
    await checkSentence(input, client);
    const request = create.mock.calls[0][0];
    const content = request.messages[0].content as string;
    expect(content).toContain(SENTENCE);
    expect(content).toContain("Learner level: A2");
    expect(content).toContain("Grammar goal: Perfekt");
    expect(content).toContain("Write feedback in: Turkish");
    expect(request.output_config.format.type).toBe("json_schema");
  });
});
