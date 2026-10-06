"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { api } from "@/lib/api/endpoints";
import { getSession, sessionFromTokens, setSession, subscribeSession, type Session } from "./session";

const subscribe = (cb: () => void) => subscribeSession(cb);
const serverSnapshot = () => null;

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, serverSnapshot);
}

/** Đã đọc xong localStorage chưa (tránh nháy trang login khi reload). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useAuthActions() {
  const queryClient = useQueryClient();

  const login = useCallback(async (email: string, password: string) => {
    setSession(sessionFromTokens(await api.login(email, password)));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setSession(sessionFromTokens(await api.register(name, email, password)));
  }, []);

  const logout = useCallback(async () => {
    const session = getSession();
    setSession(null);
    queryClient.clear();
    if (session) {
      // Thu hồi refresh token phía server; lỗi mạng không chặn việc đăng xuất cục bộ
      await api.logout(session.refreshToken).catch(() => undefined);
    }
  }, [queryClient]);

  return { login, register, logout };
}
