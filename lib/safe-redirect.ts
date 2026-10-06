/**
 * Chỉ cho phép chuyển hướng về đường dẫn nội bộ sau đăng nhập (?next=...).
 * Parse bằng URL rồi so origin — chặn cả các biến thể như "//evil", "/\evil", "/<TAB>/evil"
 * mà phép so chuỗi đơn giản bỏ lọt (trình duyệt coi dấu "\\" là "/" và bỏ qua tab/xuống dòng).
 */
export function safeNext(next: string | null | undefined, origin: string): string {
  if (!next || !next.startsWith("/")) return "/";
  try {
    const url = new URL(next, origin);
    if (url.origin !== new URL(origin).origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
