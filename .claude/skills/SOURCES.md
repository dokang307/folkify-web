# Nguồn skill (cài thủ công 2026-10-04, đã đọc nội dung trước khi cài)

| Skill | Nguồn | License | Ghi chú |
|---|---|---|---|
| `shadcn/` | https://github.com/shadcn-ui/ui/tree/main/skills/shadcn | MIT | Skill chính thức của shadcn. Khi load sẽ tự chạy `npx shadcn@latest info --json`, và có `allowed-tools: Bash(npx shadcn@latest *)` (chỉ áp dụng cho CLI chính thức). Project dùng base `base` (Base UI), nên với trigger tùy chỉnh dùng `render`, không dùng `asChild`. |
| `vercel-react-best-practices/` | https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices | MIT | 70 rule tối ưu hiệu năng React/Next.js. Đã bỏ các file `.zip`. |

Không cài:

- `web-design-guidelines`: tải bộ rule từ remote lúc chạy, có rủi ro prompt-injection.
- `ui-ux-pro-max`: trùng với `design-taste`/`frontend-design`.
- `ponytail`: trùng với `minimal-code-first`.
- `caveman`: installer dạng curl|bash, telemetry bật mặc định.
- `rtk`: cài binary + hook toàn cục, cần chính chủ máy tự cài.

Cập nhật: tải lại thư mục từ nguồn và đọc diff trước khi ghi đè.
