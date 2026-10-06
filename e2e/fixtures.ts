import { test as base, type Page, type Route } from "@playwright/test";

// API backend bị mock hoàn toàn — e2e kiểm tra UI và luồng, không phụ thuộc server thật.
export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"; // scalability-ok: same default as lib/api/client.ts

type Plan = "FREE" | "BASIC" | "PRO";

export const user = (plan: Plan) => ({
  id: "u-1",
  name: "Nguyễn Văn An",
  email: "an@example.com",
  role: "USER",
  plan,
  planExpiresAt: plan === "FREE" ? null : "2026-12-31T00:00:00",
});

const quotaFor: Record<Plan, number> = { FREE: 0, BASIC: 10, PRO: 50 };

export const instruments = [
  { id: "i-1", slug: "dan-tranh", name: "Đàn Tranh", englishName: "Dan Tranh", category: "Dây gảy", emoji: "🎵", color: "#B45309", imageUrl: null, shortDesc: "Đàn tranh 16 dây, âm thanh trong trẻo", difficulty: 3, popularity: 5, lessonCount: 3 },
  { id: "i-2", slug: "sao-truc", name: "Sáo Trúc", englishName: "Sao Truc", category: "Hơi", emoji: "🎋", color: "#15803D", imageUrl: null, shortDesc: "Sáo tre với âm thanh trong sáng", difficulty: 2, popularity: 5, lessonCount: 2 },
];

const lessons = [
  { id: "l-1", slug: "dt-01", title: "Tư thế ngồi và cách cầm đàn", duration: "15 phút", level: "Beginner", xp: 50, orderIndex: 0, requiredPlan: "FREE", locked: false, completed: true },
  { id: "l-2", slug: "dt-02", title: "Làm quen với các dây đàn", duration: "15 phút", level: "Beginner", xp: 50, orderIndex: 1, requiredPlan: "FREE", locked: false, completed: false },
  { id: "l-3", slug: "dt-09", title: "Xàng xê", duration: "25 phút", level: "Advanced", xp: 120, orderIndex: 2, requiredPlan: "PRO", locked: true, completed: false },
];

const quiz = {
  lessonId: "l-2",
  passPercent: 70,
  questions: [
    { id: "q-1", question: "Đàn tranh phổ biến có bao nhiêu dây?", type: "SINGLE", options: [{ id: "o-1", text: "16 dây" }, { id: "o-2", text: "1 dây" }] },
    { id: "q-2", question: "Ngón nào thường đeo móng gảy?", type: "MULTI", options: [{ id: "o-3", text: "Ngón cái" }, { id: "o-4", text: "Ngón trỏ" }, { id: "o-5", text: "Ngón út" }] },
  ],
};

export const songs = [
  { id: "s-1", title: "Lý cây bông", artist: "Dân ca Nam Bộ", duration: "3:45", requiredPlan: "BASIC", locked: false, scoringReady: true, referenceAudioUrl: "https://cdn.example/ly-cay-bong.mp3", referenceDurationSeconds: 225, attribution: "NSƯT A", sourceUrl: null },
  { id: "s-2", title: "Trống cơm", artist: "Dân ca Bắc Bộ", duration: "3:10", requiredPlan: "PRO", locked: true, scoringReady: true, referenceAudioUrl: null, referenceDurationSeconds: 190, attribution: null, sourceUrl: null },
  { id: "s-3", title: "Lưu thủy", artist: "Nhạc cổ truyền", duration: "4:00", requiredPlan: "BASIC", locked: false, scoringReady: false, referenceAudioUrl: null, referenceDurationSeconds: null, attribution: null, sourceUrl: null },
];

export const performance = {
  id: "p-1",
  songId: "s-1",
  songTitle: "Lý cây bông",
  instrumentSlug: "dan-tranh",
  overall: 82,
  pitchScore: 78,
  rhythmScore: 88,
  stabilityScore: 90,
  feedback: [
    "Khá tốt, chỉ còn vài chỗ cần chỉnh.",
    "Bạn đã chơi đoạn 0:45–1:30 / 3:45 (20% tác phẩm).",
    "Cao độ: lệch trung bình khoảng 22 cent.",
    "• Giây 1.2–1.8: nốt bị cao (phô) khoảng 48 cent.",
    "Độ ổn định: tốt.",
  ],
  metrics: {
    meanDeviationCents: 22,
    durationSeconds: 45,
    notesEvaluated: 30,
    noteDeviations: [{ start: 1.2, end: 1.8, cents: 48 }],
    chart: { times: [0, 1, 2, 3, 4], target: [67, 69, 72, 74, 76], user: [67.1, 69.5, 72, 74, 75.9] },
    matchedStart: 45,
    matchedEnd: 90,
    referenceDurationSeconds: 225,
    coveragePercent: 20,
  },
  createdAt: "2026-10-04T08:00:00",
};

const ok = (result: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 1000, message: "OK", result }) });
const fail = (status: number, code: number, message: string) => ({ status, contentType: "application/json", body: JSON.stringify({ code, message }) });

export async function mockApi(page: Page, plan: Plan, opts: { quotaUsed?: number } = {}) {
  const used = opts.quotaUsed ?? 0;
  await page.route(`${API}/api/**`, async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (r: ReturnType<typeof ok>) => route.fulfill(r);

    if (path === "/api/auth/login" && method === "POST") {
      return json(ok({ accessToken: "a", refreshToken: "r", tokenType: "Bearer", expiresIn: 900, user: user(plan) }));
    }
    if (path === "/api/me/entitlements") {
      const limit = quotaFor[plan];
      return json(ok({ plan, planExpiresAt: user(plan).planExpiresAt, historyDays: plan === "PRO" ? null : 30, aiQuota: { limit, used, remaining: Math.max(0, limit - used), resetsAt: "2026-11-01T00:00:00Z" } }));
    }
    if (path === "/api/plans") {
      return json(ok([
        { plan: "FREE", priceVnd: 0, durationDays: 30, aiMonthlyQuota: 0, historyDays: 30 },
        { plan: "BASIC", priceVnd: 49000, durationDays: 30, aiMonthlyQuota: 10, historyDays: 30 },
        { plan: "PRO", priceVnd: 99000, durationDays: 30, aiMonthlyQuota: 50, historyDays: null },
      ]));
    }
    if (path === "/api/progress") {
      return json(ok({ totalXp: 350, totalLessonsCompleted: 1, currentStreak: 3, longestStreak: 5, instruments: [{ id: "i-1", slug: "dan-tranh", name: "Đàn Tranh", emoji: "🎵", color: "#B45309", completedLessons: 1, totalLessons: 3, progressPercent: 33.3 }] }));
    }
    if (path === "/api/instruments") return json(ok(instruments));
    if (path === "/api/instruments/dan-tranh") {
      return json(ok({ ...instruments[0], region: "Toàn quốc", description: "Nhạc cụ dây gảy truyền thống.", origin: null, material: "Gỗ", soundRange: "3.5 quãng tám", facts: ["Đàn tranh còn gọi là đàn thập lục"], lessons }));
    }
    if (path === "/api/instruments/dan-tranh/lessons/dt-02") {
      return json(ok({ id: "l-2", slug: "dt-02", title: "Làm quen với các dây đàn", duration: "15 phút", level: "Beginner", description: "Nhận biết 16 dây.", steps: ["Xác định dây trầm nhất"], tips: ["Gảy nhẹ"], xp: 50, youtubeUrl: null, youtubeVideoId: "nBoTwUprFtk", channelName: "Thu Dung Dinh", sourceUrl: "https://www.youtube.com/watch?v=nBoTwUprFtk", requiredPlan: "FREE" }));
    }
    if (path === "/api/instruments/dan-tranh/lessons/dt-02/quiz") return json(ok(quiz));
    if (path === "/api/instruments/dan-tranh/lessons/dt-02/quiz/attempts" && method === "POST") {
      return json(ok({ scorePercent: 100, correctCount: 2, totalCount: 2, passed: true, results: [{ questionId: "q-1", correct: true, correctOptionIds: ["o-1"], explanation: "Đàn tranh phổ biến có 16 dây." }, { questionId: "q-2", correct: true, correctOptionIds: ["o-3", "o-4"], explanation: null }], completion: { xpEarned: 50, totalXp: 400, currentStreak: 3, newAchievements: [] } }));
    }
    if (path === "/api/instruments/dan-tranh/songs" || path === "/api/instruments/sao-truc/songs") return json(ok(songs));
    if (path === "/api/performances" && method === "POST") {
      if (plan === "FREE") return json(fail(403, 1310, "Gói hiện tại chưa hỗ trợ chấm điểm AI"));
      return json(ok(performance));
    }
    if (path === "/api/performances") return json(ok({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }));
    if (path === "/api/performances/p-1") return json(ok(performance));
    if (path.startsWith("/api/payments/status/")) {
      return json(ok({ orderId: path.split("/").pop(), status: "SUCCESS", targetPlan: "PRO" }));
    }
    return json(fail(404, 4004, `Không có mock cho ${method} ${path}`));
  });
}

export async function signIn(page: Page, plan: Plan) {
  await page.addInitScript((u) => {
    window.localStorage.setItem("folkify.session", JSON.stringify({ accessToken: "a", refreshToken: "r", user: u }));
  }, user(plan));
}

export const test = base;
export { expect } from "@playwright/test";
