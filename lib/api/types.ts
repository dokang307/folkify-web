// DTO khớp với folkify_backend (không có package schema dùng chung — giữ đồng bộ bằng tay).

export type Plan = "FREE" | "BASIC" | "PRO";

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  result: T;
  errors?: Record<string, string>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  plan: Plan;
  planExpiresAt: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface InstrumentSummary {
  id: string;
  slug: string;
  name: string;
  englishName: string | null;
  category: string | null;
  emoji: string | null;
  color: string | null;
  imageUrl: string | null;
  shortDesc: string | null;
  difficulty: number;
  popularity: number;
  lessonCount: number;
}

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  duration: string | null;
  level: string | null;
  xp: number;
  orderIndex: number;
  requiredPlan: Plan;
  locked: boolean;
  completed: boolean;
}

export interface InstrumentDetail extends Omit<InstrumentSummary, "lessonCount"> {
  region: string | null;
  description: string | null;
  origin: string | null;
  material: string | null;
  soundRange: string | null;
  facts: string[];
  lessons: LessonSummary[];
  songs: Song[];
}

export interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  duration: string | null;
  level: string | null;
  description: string | null;
  steps: string[];
  tips: string[];
  xp: number;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  channelName: string | null;
  sourceUrl: string | null;
  requiredPlan: Plan;
}

export type QuestionType = "SINGLE" | "MULTI";

export interface Quiz {
  lessonId: string;
  passPercent: number;
  questions: { id: string; question: string; type: QuestionType; options: { id: string; text: string }[] }[];
}

export interface CompleteLessonResult {
  xpEarned: number;
  totalXp: number;
  currentStreak: number;
  newAchievements: { id: string; slug: string; name: string; description: string; icon: string | null }[];
}

export interface QuizResult {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  results: { questionId: string; correct: boolean; correctOptionIds: string[]; explanation: string | null }[];
  completion: CompleteLessonResult | null;
}

export interface AiQuota {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

export interface Entitlements {
  plan: Plan;
  planExpiresAt: string | null;
  aiQuota: AiQuota;
  historyDays: number | null;
}

export interface PlanInfo {
  plan: Plan;
  priceVnd: number;
  durationDays: number;
  aiMonthlyQuota: number;
  historyDays: number | null;
}

/** Tác phẩm của nhạc cụ — đơn vị để AI chấm phần trình diễn. */
export interface Song {
  id: string;
  title: string;
  artist: string | null;
  duration: string | null;
  requiredPlan: Plan;
  /** Gói hiện tại chưa đủ để AI chấm tác phẩm này. */
  locked: boolean;
  /** Đã có bản mẫu để chấm. */
  scoringReady: boolean;
  referenceAudioUrl: string | null;
  referenceDurationSeconds: number | null;
  attribution: string | null;
  sourceUrl: string | null;
}

export interface NoteDeviation {
  start: number;
  end: number;
  cents: number;
}

export interface PerformanceMetrics {
  meanDeviationCents?: number;
  durationSeconds?: number;
  notesEvaluated?: number;
  noteDeviations?: NoteDeviation[];
  chart?: { times: number[]; target: number[]; user: number[] };
  /** Khúc của tác phẩm người học đã chơi (giây trên bản mẫu). */
  matchedStart?: number;
  matchedEnd?: number;
  referenceDurationSeconds?: number;
  coveragePercent?: number;
}

export interface Performance {
  id: string;
  songId: string;
  songTitle: string;
  instrumentSlug: string;
  overall: number;
  pitchScore: number;
  rhythmScore: number;
  stabilityScore: number;
  feedback: string[];
  metrics: PerformanceMetrics;
  createdAt: string;
}

export type PerformanceSummary = Omit<Performance, "feedback" | "metrics" | "songId"> & {
  coveragePercent: number | null;
};

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface InstrumentProgress {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  color: string | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export interface UserProgress {
  totalXp: number;
  totalLessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  instruments: InstrumentProgress[];
}

export interface CheckoutResult {
  payUrl: string;
  orderId: string;
}

export interface PaymentStatus {
  orderId: string;
  // Khớp TransactionStatus.java
  status: "PENDING" | "SUCCESS" | "CANCELLED" | "FAILED";
  targetPlan: Plan;
}
