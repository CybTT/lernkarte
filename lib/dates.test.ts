import { describe, expect, it } from "vitest";
import { countByDay, dayKey, lastDayKeys } from "./dates";

describe("Turkish calendar days", () => {
  it("puts a 00:30 Istanbul review on that day, not the previous one", () => {
    // 2026-11-23T21:30Z is 2026-11-24 00:30 in Istanbul (UTC+3).
    expect(dayKey(new Date("2026-11-23T21:30:00Z"))).toBe("2026-11-24");
    expect(dayKey(new Date("2026-11-23T20:59:00Z"))).toBe("2026-11-23");
  });

  it("counts reviews per Istanbul day", () => {
    expect(
      countByDay(["2026-11-23T20:00:00Z", "2026-11-23T22:00:00Z", "2026-11-24T10:00:00Z"])
    ).toEqual({ "2026-11-23": 1, "2026-11-24": 2 });
  });

  it("lists the last N days ending on today's Istanbul date", () => {
    const now = new Date("2026-03-01T22:00:00Z"); // 2 March 01:00 in Istanbul
    expect(lastDayKeys(3, now)).toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
  });
});
