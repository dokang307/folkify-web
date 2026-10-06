import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, micErrorMessage, pickRecordingFormat, validateUpload } from "./recording";

describe("pickRecordingFormat", () => {
  it("prefers webm/opus, falls back to mp4 for Safari", () => {
    expect(pickRecordingFormat(() => true)?.mime).toBe("audio/webm;codecs=opus");
    expect(pickRecordingFormat((m) => m === "audio/mp4")).toEqual({ mime: "audio/mp4", ext: "m4a" });
    expect(pickRecordingFormat(() => false)).toBeNull();
  });
});

describe("validateUpload", () => {
  it("accepts audio files by mime or extension", () => {
    expect(validateUpload({ size: 1000, type: "audio/mpeg", name: "a.mp3" })).toBeNull();
    expect(validateUpload({ size: 1000, type: "", name: "take.M4A" })).toBeNull();
  });

  it("rejects empty, oversized and non-audio files", () => {
    expect(validateUpload({ size: 0, type: "audio/wav", name: "a.wav" })).toMatch(/rỗng/);
    expect(validateUpload({ size: MAX_UPLOAD_BYTES + 1, type: "audio/wav", name: "a.wav" })).toMatch(/quá lớn/);
    expect(validateUpload({ size: 10, type: "image/png", name: "a.png" })).toMatch(/không hỗ trợ/);
  });
});

describe("micErrorMessage", () => {
  it("explains permission denial with a way forward", () => {
    expect(micErrorMessage(new DOMException("x", "NotAllowedError"))).toMatch(/cho phép Micro/);
    expect(micErrorMessage(new Error("boom"))).toMatch(/tải file/);
  });
});
