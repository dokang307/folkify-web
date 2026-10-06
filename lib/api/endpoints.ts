import { request } from "./client";
import type {
  AuthTokens,
  CheckoutResult,
  Entitlements,
  InstrumentDetail,
  InstrumentSummary,
  LessonDetail,
  Page,
  PaymentStatus,
  Performance,
  PerformanceSummary,
  Plan,
  PlanInfo,
  Quiz,
  Song,
  QuizResult,
  UserProgress,
} from "./types";

export const api = {
  login: (email: string, password: string) =>
    request<AuthTokens>("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (name: string, email: string, password: string) =>
    request<AuthTokens>("/api/auth/register", { method: "POST", body: { name, email, password }, auth: false }),
  forgotPassword: (email: string) =>
    request<void>("/api/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  logout: (refreshToken: string) =>
    request<void>("/api/auth/logout", { method: "POST", body: { refreshToken } }),

  instruments: () => request<InstrumentSummary[]>("/api/instruments"),
  instrument: (slug: string) => request<InstrumentDetail>(`/api/instruments/${encodeURIComponent(slug)}`),
  lesson: (slug: string, lessonSlug: string) =>
    request<LessonDetail>(`/api/instruments/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`),
  quiz: (slug: string, lessonSlug: string) =>
    request<Quiz>(`/api/instruments/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz`),
  submitQuiz: (slug: string, lessonSlug: string, answers: Record<string, string[]>) =>
    request<QuizResult>(
      `/api/instruments/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz/attempts`,
      { method: "POST", body: { answers } },
    ),

  entitlements: () => request<Entitlements>("/api/me/entitlements"),
  plans: () => request<PlanInfo[]>("/api/plans", { auth: false }),
  progress: () => request<UserProgress>("/api/progress"),

  songs: (instrumentSlug: string) => request<Song[]>(`/api/instruments/${encodeURIComponent(instrumentSlug)}/songs`),
  /** Gửi bản ghi một đoạn hoặc cả tác phẩm — AI tự dò đoạn đã chơi. */
  submitPerformance: (audio: Blob, filename: string, songId: string) => {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("songId", songId);
    return request<Performance>("/api/performances", { method: "POST", form });
  },
  performances: (page = 0, size = 20) => request<Page<PerformanceSummary>>(`/api/performances?page=${page}&size=${size}`),
  performance: (id: string) => request<Performance>(`/api/performances/${encodeURIComponent(id)}`),

  checkout: (plan: Exclude<Plan, "FREE">) =>
    request<CheckoutResult>("/api/payments/checkout", { method: "POST", body: { plan, platform: "WEB" } }),
  paymentStatus: (orderId: string) => request<PaymentStatus>(`/api/payments/status/${encodeURIComponent(orderId)}`),
};
