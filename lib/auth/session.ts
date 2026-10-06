import type { AuthTokens, AuthUser } from "@/lib/api/types";

// Phiên đăng nhập lưu ở localStorage (cùng cách landing page làm). Mọi truy cập đều bọc try/catch
// vì storage có thể bị chặn (chế độ ẩn danh, cookie bị tắt) — khi đó app vẫn chạy, chỉ không nhớ phiên.
const KEY = "folkify.session";

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();
let cached: Session | null | undefined;

export function getSession(): Session | null {
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    cached = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function setSession(session: Session | null): void {
  cached = session;
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    // storage không khả dụng — giữ phiên trong bộ nhớ
  }
  listeners.forEach((l) => l(session));
}

export function sessionFromTokens(tokens: AuthTokens): Session {
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user };
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
