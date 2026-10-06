import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-redirect";

const ORIGIN = "https://app.folkify.vn";

describe("safeNext", () => {
  it("keeps internal paths with query and hash", () => {
    expect(safeNext("/instruments/dan-tranh?tab=1#x", ORIGIN)).toBe("/instruments/dan-tranh?tab=1#x");
  });

  it.each([
    "//evil.example.com",
    "/\\evil.example.com",
    "/\t/evil.example.com",
    "/\n/evil.example.com",
    "https://evil.example.com",
    "javascript:alert(1)",
  ])("rejects external target %j", (next) => {
    expect(safeNext(next, ORIGIN)).toBe("/");
  });

  it("defaults to home when missing", () => {
    expect(safeNext(null, ORIGIN)).toBe("/");
    expect(safeNext("", ORIGIN)).toBe("/");
  });
});
