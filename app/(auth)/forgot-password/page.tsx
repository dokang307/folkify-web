"use client";

import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setPending(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold">Kiểm tra hộp thư</h1>
        <p className="text-muted-foreground">Nếu email đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">Quay lại đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Quên mật khẩu</h1>
        <p className="text-muted-foreground">Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Gửi liên kết
        </Button>
      </form>
      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}
