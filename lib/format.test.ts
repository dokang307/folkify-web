import { describe, expect, it } from "vitest";
import {
  extractYoutubeId,
  formatSeconds,
  instrumentColor,
  midiToNoteName,
  parseServerDate,
  planAtLeast,
  scoreTone,
} from "./format";

describe("planAtLeast", () => {
  it("respects FREE < BASIC < PRO", () => {
    expect(planAtLeast("PRO", "BASIC")).toBe(true);
    expect(planAtLeast("BASIC", "PRO")).toBe(false);
    expect(planAtLeast("FREE", "FREE")).toBe(true);
  });
});

describe("midiToNoteName", () => {
  it("names notes in Vietnamese with octave", () => {
    expect(midiToNoteName(60)).toBe("Đô4");
    expect(midiToNoteName(67.2)).toBe("Sol4");
    expect(midiToNoteName(69)).toBe("La4");
  });
});

describe("parseServerDate", () => {
  it("treats zone-less LocalDateTime as UTC", () => {
    expect(parseServerDate("2026-10-04T10:00:00").toISOString()).toBe("2026-10-04T10:00:00.000Z");
    expect(parseServerDate("2026-11-01T00:00:00Z").toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("helpers", () => {
  it("formats seconds as m:ss", () => {
    expect(formatSeconds(75.9)).toBe("1:15");
    expect(formatSeconds(-3)).toBe("0:00");
  });

  it("maps scores to tones", () => {
    expect(scoreTone(95)).toBe("excellent");
    expect(scoreTone(80)).toBe("good");
    expect(scoreTone(60)).toBe("fair");
    expect(scoreTone(10)).toBe("weak");
  });

  it("only accepts hex instrument colors", () => {
    expect(instrumentColor("#B45309")).toBe("#B45309");
    expect(instrumentColor("red; background:url(x)")).toBe("var(--primary)");
    expect(instrumentColor(null)).toBe("var(--primary)");
  });

  it("extracts YouTube ids from urls and raw ids", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=gnog5AYksx4")).toBe("gnog5AYksx4");
    expect(extractYoutubeId("https://www.youtube.com/embed/gnog5AYksx4")).toBe("gnog5AYksx4");
    expect(extractYoutubeId("gnog5AYksx4")).toBe("gnog5AYksx4");
    expect(extractYoutubeId("https://www.youtube.com/embed/example1")).toBeNull();
  });
});
