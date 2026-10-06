// Giới hạn khớp với folkify_ai (AI_MIN_SECONDS / AI_MAX_SECONDS) và backend (AI_MAX_UPLOAD_BYTES).
// Người học chơi một đoạn (≥ 5 giây) hoặc cả tác phẩm (≤ 6 phút)
export const MIN_SECONDS = 5;
export const MAX_SECONDS = 360;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const COUNTDOWN_SECONDS = 3;

// Thứ tự ưu tiên: Opus/WebM (Chrome, Firefox, Edge) → MP4/AAC (Safari)
const CANDIDATES: { mime: string; ext: string }[] = [
  { mime: "audio/webm;codecs=opus", ext: "webm" },
  { mime: "audio/webm", ext: "webm" },
  { mime: "audio/mp4", ext: "m4a" },
  { mime: "audio/ogg;codecs=opus", ext: "ogg" },
];

export function pickRecordingFormat(isSupported: (mime: string) => boolean): { mime: string; ext: string } | null {
  return CANDIDATES.find((c) => isSupported(c.mime)) ?? null;
}

export const ACCEPTED_UPLOAD_TYPES = ".mp3,.m4a,.wav,.ogg,.webm,.aac,audio/*";

export function validateUpload(file: { size: number; type: string; name: string }): string | null {
  if (file.size === 0) return "File rỗng.";
  if (file.size > MAX_UPLOAD_BYTES) return `File quá lớn (tối đa ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`;
  const looksAudio = file.type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|webm|aac)$/i.test(file.name);
  return looksAudio ? null : "Định dạng không hỗ trợ — hãy chọn file âm thanh (mp3, m4a, wav, ogg, webm).";
}

export function micErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Trình duyệt đang chặn micro. Bấm biểu tượng ổ khóa cạnh thanh địa chỉ → cho phép Micro, rồi thử lại. Hoặc tải file ghi âm lên.";
  }
  if (name === "NotFoundError") return "Không tìm thấy micro. Hãy cắm micro/tai nghe, hoặc tải file ghi âm lên.";
  if (name === "NotReadableError") return "Micro đang được ứng dụng khác sử dụng. Đóng ứng dụng đó rồi thử lại.";
  return "Không mở được micro. Bạn có thể tải file ghi âm lên thay thế.";
}
