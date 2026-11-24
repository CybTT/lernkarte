import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safeNext";

describe("safeNextPath", () => {
  it("keeps same-site paths, including query and hash", () => {
    expect(safeNextPath("/extension-connect")).toBe("/extension-connect");
    expect(safeNextPath("/study?mode=typing#top")).toBe("/study?mode=typing#top");
  });

  it("falls back for missing values", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "@evil.example",
    "/\t/evil.example",
  ])("rejects off-site target %s", (next) => {
    expect(safeNextPath(next)).toBe("/");
  });

  it("uses the given fallback", () => {
    expect(safeNextPath("https://evil.example", "/login")).toBe("/login");
  });
});
