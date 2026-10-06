# folkify_web

Web app dành cho học viên Folkify: học qua video, làm câu hỏi ôn tập, thu âm và nhận AI chấm điểm. Đây là project riêng, không thuộc `folkifylandingpage`. Toàn bộ dữ liệu lấy từ API của `folkify_backend`.

## Chạy

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=<url backend>
npm install
npm run dev                    # http://localhost:3001 (landing chạy ở 3000)
```

| Lệnh | Việc |
|---|---|
| `npm run build` | Build production (Next.js 16, Turbopack) |
| `npm run lint` | ESLint |
| `npm test` | Vitest — logic thuần trong `lib/` |
| `npm run test:e2e` | Playwright với API mock, chạy trên Chrome đã cài sẵn (`E2E_CHANNEL` để đổi trình duyệt). Cần `npm run build` trước |
| `SCREENSHOT_DIR=<thư mục> npx playwright test e2e/screens.spec.ts` | Chụp màn hình các trang chính (sáng/tối, desktop/mobile) để review |

Cấu hình phía backend cho web app:

- `PAYOS_WEB_RETURN_URL` / `PAYOS_WEB_CANCEL_URL`: trỏ về `<web>/pricing/result`. Khi web gọi checkout sẽ gửi kèm `platform: "WEB"`.
- CORS: hiện backend cho phép mọi origin.

## Cấu trúc

```
app/(auth)/        login, signup, forgot-password — layout chia đôi màn hình
app/(app)/         các trang cần đăng nhập (AppShell có guard + nav)
  page.tsx         trang chủ: học tiếp, streak/XP, quota AI
  instruments/     danh sách nhạc cụ → lộ trình → bài học (YouTube lite-embed) → quiz
  practice/        chọn nhạc cụ → tác phẩm → nghe bản mẫu → ghi âm/upload (một đoạn hoặc cả bài) → results/[id] (có "đoạn đã chơi")
  history, progress, pricing (+ result: poll trạng thái PayOS), account
components/app/    shell, page header (motif dây đàn), paywall, các trạng thái
components/learn/  instrument card, lesson path, lesson view, quiz
components/practice/ recorder (MediaRecorder + waveform), score ring, contour chart
lib/api/           client (envelope ApiResponse, refresh token single-flight), endpoints, types
lib/auth/          session (localStorage, chịu được storage bị chặn), hooks
```

## Ngôn ngữ thiết kế

- Kế thừa token của landing: xanh tre (oklch hue 152) và Geist. Nền ấm như giấy dó. Có thêm dark mode, nền mực xanh rêu.
- Tiêu đề dùng **Fraunces**, một serif mềm có hỗ trợ tiếng Việt.
- Đỏ sơn mài (`--lacquer`) và vàng (`--gold`) chỉ dùng cho streak, XP và điểm cao.
- Mỗi nhạc cụ có accent riêng `--inst`, lấy từ `instruments.color` trong DB và đã qua kiểm tra định dạng hex.
- Motif "dây đàn" (`.strings-motif`) làm texture cho header.
- Mọi màn hình đều có đủ trạng thái loading, empty, error kèm retry, và locked kèm paywall. Animation tôn trọng `prefers-reduced-motion`.
