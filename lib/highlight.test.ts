import { describe, expect, it } from "vitest";
import { segmentSentence } from "./highlight";

describe("segmentSentence", () => {
  it("marks each error fragment in place", () => {
    expect(segmentSentence("Ich gehe mit meine Freund.", ["meine", "Freund"])).toEqual([
      { text: "Ich gehe mit ", errorIndex: null },
      { text: "meine", errorIndex: 0 },
      { text: " ", errorIndex: null },
      { text: "Freund", errorIndex: 1 },
      { text: ".", errorIndex: null },
    ]);
  });

  it("matches regardless of case but keeps the learner's spelling", () => {
    expect(segmentSentence("ich habe ein auto.", ["Auto"])[1]).toEqual({ text: "auto", errorIndex: 0 });
  });

  it("gives repeated fragments separate occurrences", () => {
    const segments = segmentSentence("der Mann und der Hund", ["der", "der"]);
    expect(segments.filter((s) => s.errorIndex !== null).map((s) => s.errorIndex)).toEqual([0, 1]);
  });

  it("leaves missing or overlapping fragments unhighlighted", () => {
    expect(segmentSentence("Das ist gut.", [null, "nicht da"])).toEqual([
      { text: "Das ist gut.", errorIndex: null },
    ]);
    const overlapping = segmentSentence("Das ist gut.", ["ist gut", "gut"]);
    expect(overlapping.filter((s) => s.errorIndex !== null)).toEqual([{ text: "ist gut", errorIndex: 0 }]);
  });

  it("keeps the whole sentence text", () => {
    const sentence = "Gestern ich bin nach Hause gegangen.";
    const joined = segmentSentence(sentence, ["ich bin", "Hause"]).map((s) => s.text).join("");
    expect(joined).toBe(sentence);
  });
});
