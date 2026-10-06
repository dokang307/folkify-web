"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { Toaster } from "@/components/ui/sonner";

const STALE_MS = 30_000;
const MAX_RETRIES = 2;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_MS,
            refetchOnWindowFocus: false,
            // Lỗi 4xx (quyền, không tìm thấy) thử lại vô ích — chỉ retry lỗi mạng/5xx
            retry: (count, error) =>
              count < MAX_RETRIES && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
          },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
