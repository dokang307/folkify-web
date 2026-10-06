import type { Plan } from "@/lib/api/types";

export const PLAN_ORDER: Plan[] = ["FREE", "BASIC", "PRO"];

export const PLAN_LABEL: Record<Plan, string> = {
  FREE: "Miễn phí",
  BASIC: "Basic",
  PRO: "Premium",
};

export function planAtLeast(current: Plan, required: Plan): boolean {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);
}

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
export const formatVnd = (amount: number) => vnd.format(amount);

const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Backend trả LocalDateTime không kèm múi giờ (UTC) hoặc Instant có "Z" — chuẩn hoá về UTC. */
export function parseServerDate(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}
export const formatDate = (value: string) => dateFmt.format(parseServerDate(value));
export const formatDateTime = (value: string) => dateTimeFmt.format(parseServerDate(value));

const NOTE_NAMES = ["Đô", "Đô#", "Rê", "Rê#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

/** MIDI → tên nốt kiểu Việt kèm quãng tám (60 = Đô4). */
export function midiToNoteName(midi: number): string {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${octave}`;
}

export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type ScoreTone = "excellent" | "good" | "fair" | "weak";

export function scoreTone(score: number): ScoreTone {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "fair";
  return "weak";
}

export const SCORE_TONE_LABEL: Record<ScoreTone, string> = {
  excellent: "Xuất sắc",
  good: "Khá tốt",
  fair: "Tạm ổn",
  weak: "Cần luyện thêm",
};

/** Màu nhạc cụ từ DB (#RRGGBB) → giá trị CSS an toàn; sai định dạng thì dùng màu chủ đạo. */
export function instrumentColor(color: string | null | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "var(--primary)";
}

export function extractYoutubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  if (/^[\w-]{11}$/.test(input)) return input;
  const match = input.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return match ? match[1] : null;
}
