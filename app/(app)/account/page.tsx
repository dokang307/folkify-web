"use client";

import { useEffect, useState } from "react";
import { LogOut, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { PlanBadge } from "@/components/app/plan";
import { ListSkeleton } from "@/components/app/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api/endpoints";
import { useAuthActions, useSession } from "@/lib/auth/use-session";
import { PLAN_LABEL, formatDate } from "@/lib/format";
import { useEntitlements } from "@/lib/queries";
import { cn } from "@/lib/utils";

function RatingSection() {
  const qc = useQueryClient();
  const existing = useQuery({ queryKey: ["my-rating"], queryFn: () => api.myRating(), retry: false });
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (existing.data) {
      setScore(existing.data.score);
      setComment(existing.data.comment ?? "");
    }
  }, [existing.data]);

  const mutation = useMutation({
    mutationFn: () => api.submitRating(score, comment),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-rating"] }); setSubmitted(true); },
  });

  return (
    <section className="space-y-4 rounded-3xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Đánh giá ứng dụng</h2>
      <p className="text-sm text-muted-foreground">Chia sẻ trải nghiệm của bạn với Folkify</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setScore(n)} className="p-0.5">
            <Star
              className={cn("size-8 transition-colors", n <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Nhận xét (không bắt buộc)"
        rows={3}
        className="w-full rounded-xl border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} disabled={score === 0 || mutation.isPending} size="sm">
          {mutation.isPending ? "Đang gửi..." : existing.data ? "Cập nhật" : "Gửi đánh giá"}
        </Button>
        {submitted && <span className="text-sm text-green-600">Cảm ơn bạn đã đánh giá!</span>}
      </div>
    </section>
  );
}

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
      <RatingSection />
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
