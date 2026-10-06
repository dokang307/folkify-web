import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/app/auth-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
