"use client";

import { LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { PlanBadge } from "@/components/app/plan";
import { ListSkeleton } from "@/components/app/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthActions, useSession } from "@/lib/auth/use-session";
import { PLAN_LABEL, formatDate } from "@/lib/format";
import { useEntitlements } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const session = useSession();
  const entitlements = useEntitlements();
  const { logout } = useAuthActions();
  const router = useRouter();
  if (!session) return null;
  const e = entitlements.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Tài khoản" title={session.user.name} description={session.user.email} />
      <section className="space-y-4 rounded-3xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Gói của bạn</h2>
        {!e ? (
          <ListSkeleton rows={2} />
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Gói hiện tại</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                {PLAN_LABEL[e.plan]} <PlanBadge plan={e.plan} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Hết hạn</dt>
              <dd className="mt-1 font-medium">{e.planExpiresAt ? formatDate(e.planExpiresAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">AI chấm điểm tháng này</dt>
              <dd className="mt-1 font-medium tabular">
                {e.aiQuota.limit === 0 ? "Không có trong gói" : `${e.aiQuota.used}/${e.aiQuota.limit} lượt đã dùng`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Lượt mới vào</dt>
              <dd className="mt-1 font-medium">{formatDate(e.aiQuota.resetsAt)}</dd>
            </div>
          </dl>
        )}
        <Link href="/pricing" className={cn(buttonVariants(), "h-9")}>
          <Sparkles aria-hidden /> {e?.plan === "FREE" ? "Nâng cấp" : "Gia hạn / đổi gói"}
        </Link>
      </section>
      <Button
        variant="outline"
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <LogOut aria-hidden /> Đăng xuất
      </Button>
    </div>
  );
}
