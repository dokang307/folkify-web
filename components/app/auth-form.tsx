"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useAuthActions } from "@/lib/auth/use-session";
import { safeNext } from "@/lib/safe-redirect";

const MIN_PASSWORD = 8;


export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, register } = useAuthActions();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    setError(null);
    setFieldErrors({});
    if (mode === "signup" && password.length < MIN_PASSWORD) {
      setFieldErrors({ password: `Mật khẩu cần tối thiểu ${MIN_PASSWORD} ký tự` });
      return;
    }
    setPending(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      router.replace(safeNext(params.get("next"), window.location.origin));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else {
        setError("Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  const isLogin = mode === "login";
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{isLogin ? "Chào mừng trở lại" : "Bắt đầu học miễn phí"}</h1>
        <p className="text-muted-foreground">
          {isLogin ? "Đăng nhập để tiếp tục bài học của bạn." : "Tạo tài khoản để mở 2 bài học đầu của mọi nhạc cụ."}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {!isLogin && (
          <Field id="name" label="Họ và tên" error={fieldErrors.name}>
            <Input id="name" name="name" autoComplete="name" required className="h-10" />
          </Field>
        )}
        <Field id="email" label="Email" error={fieldErrors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
        </Field>
        <Field
          id="password"
          label="Mật khẩu"
          error={fieldErrors.password}
          extra={isLogin && <Link href="/forgot-password" className="text-xs text-primary hover:underline">Quên mật khẩu?</Link>}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : MIN_PASSWORD}
            className="h-10"
          />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
        <Link
          href={`${isLogin ? "/signup" : "/login"}${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}
          className="font-medium text-primary hover:underline"
        >
          {isLogin ? "Đăng ký" : "Đăng nhập"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  extra,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {extra}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
