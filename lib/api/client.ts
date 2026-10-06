import { getSession, sessionFromTokens, setSession } from "@/lib/auth/session";
import type { ApiEnvelope, AuthTokens } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"; // scalability-ok: dev default of env var

/** Mã lỗi backend (ErrorCode.java) mà UI xử lý riêng. */
export const ErrorCodes = {
  UNAUTHORIZED: 4001,
  PLAN_REQUIRED: 1106,
  AI_NOT_IN_PLAN: 1310,
  AI_QUOTA_EXCEEDED: 1311,
  AUDIO_INVALID: 1312,
  AI_SERVICE_UNAVAILABLE: 1313,
  INVALID_REFRESH_TOKEN: 1003,
  REFRESH_TOKEN_EXPIRED: 1004,
} as const;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: number,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Lỗi do gói chưa đủ quyền → UI hiện paywall thay vì thông báo lỗi. */
  get isPlanGate(): boolean {
    return this.code === ErrorCodes.PLAN_REQUIRED || this.code === ErrorCodes.AI_NOT_IN_PLAN;
  }
}

const NETWORK_ERROR = "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.";

async function parse<T>(res: Response): Promise<T> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // body không phải JSON (vd. proxy lỗi)
  }
  if (!res.ok || !body) {
    throw new ApiError(body?.message ?? "Đã có lỗi xảy ra", res.status, body?.code ?? res.status, body?.errors);
  }
  return body.result;
}

// Single-flight: nhiều request cùng gặp 401 chỉ gọi refresh một lần.
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const tokens = await parse<AuthTokens>(res);
      setSession(sessionFromTokens(tokens));
      return true;
    } catch (err) {
      // Chỉ đăng xuất khi server khẳng định refresh token không còn hợp lệ;
      // lỗi mạng/5xx tạm thời thì giữ phiên để người dùng thử lại.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) setSession(null);
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  form?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
}

export async function request<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const { method = "GET", body, form, auth = true, signal } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const session = auth ? getSession() : null;
  if (session) headers.Authorization = `Bearer ${session.accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(NETWORK_ERROR, 0, 0);
  }

  if (res.status === 401 && session && !retried && (await refreshSession())) {
    return request<T>(path, opts, true);
  }
  return parse<T>(res);
}
