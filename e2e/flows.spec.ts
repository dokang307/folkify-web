import path from "node:path";
import { expect, mockApi, signIn, test } from "./fixtures";

test("guest is sent to login and lands on home after signing in", async ({ page }) => {
  await mockApi(page, "BASIC");
  await page.goto("/instruments");
  await expect(page).toHaveURL(/\/login\?next=%2Finstruments/);
  await page.getByLabel("Email").fill("an@example.com");
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/instruments$/);
  await expect(page.getByRole("heading", { name: "Chọn nhạc cụ của bạn" })).toBeVisible();
});

test("login rejects open redirect in ?next", async ({ page }) => {
  await mockApi(page, "BASIC");
  await page.goto("/login?next=//evil.example.com");
  await page.getByLabel("Email").fill("an@example.com");
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
});

test("lesson path shows locks; locked lesson opens paywall", async ({ page }) => {
  await mockApi(page, "FREE");
  await signIn(page, "FREE");
  await page.goto("/instruments/dan-tranh");
  await expect(page.getByRole("heading", { name: "Đàn Tranh", level: 1 })).toBeVisible();
  await expect(page.getByText("Học tiếp")).toBeVisible();
  await page.getByRole("button", { name: /Xàng xê/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Mở khóa để học tiếp");
  await expect(page.getByRole("dialog")).toContainText("50 lượt AI chấm điểm / tháng");
});

test("watch lesson, take quiz, pass and earn XP", async ({ page }) => {
  await mockApi(page, "FREE");
  await signIn(page, "FREE");
  await page.goto("/instruments/dan-tranh/lessons/dt-02");
  await expect(page.getByRole("button", { name: /Phát video/ })).toBeVisible();
  await expect(page.getByText("Thu Dung Dinh")).toBeVisible();
  await page.getByRole("link", { name: "Làm câu hỏi ôn tập" }).click();

  await page.getByRole("radio", { name: /16 dây/ }).click();
  await page.getByRole("button", { name: "Câu tiếp" }).click();
  await page.getByRole("checkbox", { name: /Ngón cái/ }).click();
  await page.getByRole("checkbox", { name: /Ngón trỏ/ }).click();
  await page.getByRole("button", { name: "Nộp bài" }).click();

  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByText("+50 XP · Chuỗi 3 ngày")).toBeVisible();
  await expect(page.getByText("Đàn tranh phổ biến có 16 dây.")).toBeVisible();
});

test("FREE plan sees AI paywall instead of recorder", async ({ page }) => {
  await mockApi(page, "FREE");
  await signIn(page, "FREE");
  await page.goto("/practice?instrument=dan-tranh");
  await page.getByRole("button", { name: /Lý cây bông/ }).click();
  await expect(page.getByText("AI chấm điểm có trong gói Basic và Premium")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bắt đầu ghi âm" })).toHaveCount(0);
});

test("BASIC plan with exhausted quota sees reset date", async ({ page }) => {
  await mockApi(page, "BASIC", { quotaUsed: 10 });
  await signIn(page, "BASIC");
  await page.goto("/practice?instrument=dan-tranh&song=s-1");
  await expect(page.getByText("Bạn đã dùng hết lượt chấm điểm tháng này")).toBeVisible();
  await expect(page.getByText("01/11/2026")).toBeVisible();
});

test("songs above plan open the paywall, songs without reference are not selectable", async ({ page }) => {
  await mockApi(page, "BASIC");
  await signIn(page, "BASIC");
  await page.goto("/practice?instrument=dan-tranh");
  await expect(page.getByRole("button", { name: /Lưu thủy/ })).toBeDisabled();
  await expect(page.getByText("Chọn một tác phẩm để bắt đầu")).toBeVisible();
  await page.getByRole("button", { name: /Trống cơm/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Premium");
});

test("BASIC plan records a song excerpt and sees where it sits in the piece", async ({ page }) => {
  await mockApi(page, "BASIC");
  await signIn(page, "BASIC");
  await page.goto("/practice?instrument=dan-tranh");
  await page.getByRole("button", { name: /Lý cây bông/ }).click();
  await expect(page.getByRole("heading", { name: "Lý cây bông" })).toBeVisible();
  await expect(page.getByText("Còn 10/10 lượt")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "take.wav"));
  await page.getByRole("button", { name: "Gửi AI chấm điểm" }).click();

  await expect(page).toHaveURL(/\/practice\/results\/p-1$/);
  await expect(page.getByRole("img", { name: /Điểm tổng 82\/100/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Khá tốt, chỉ còn vài chỗ cần chỉnh." })).toBeVisible();
  await expect(page.getByText("Giây 1.2–1.8: nốt bị cao (phô) khoảng 48 cent.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đường cao độ" })).toBeVisible();
  await expect(page.getByText("0:45–1:30 · 20% tác phẩm")).toBeVisible();
  await expect(page.getByRole("img", { name: /Đã chơi từ 0:45 đến 1:30 trên tổng 3:45/ })).toBeVisible();
});

test("payment result page confirms an activated plan", async ({ page }) => {
  await mockApi(page, "BASIC");
  await signIn(page, "BASIC");
  await page.goto("/pricing/result?orderCode=1759500000000&status=PAID&cancel=false");
  await expect(page.getByRole("heading", { name: "Chào mừng đến gói Premium!" })).toBeVisible();
});

test("login rejects backslash open redirect", async ({ page }) => {
  await mockApi(page, "BASIC");
  await page.goto(`/login?next=${encodeURIComponent("/\\evil.example.com")}`);
  await page.getByLabel("Email").fill("an@example.com");
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
});
