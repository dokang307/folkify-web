"use client";

import { Check, Crown, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Plan } from "@/lib/api/types";
import { PLAN_LABEL, formatVnd } from "@/lib/format";
import { usePlans } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function PlanBadge({ plan, className }: { plan: Plan; className?: string }) {
  if (plan === "FREE") return null;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-medium",
        plan === "PRO" && "bg-gold/15 text-[color:var(--foreground)] ring-1 ring-gold/40",
        className,
      )}
    >
      {plan === "PRO" ? <Crown className="size-3" aria-hidden /> : <Sparkles className="size-3" aria-hidden />}
      {PLAN_LABEL[plan]}
    </Badge>
  );
}

export function LockedBadge({ plan }: { plan: Plan }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Lock className="size-3" aria-hidden /> Gói {PLAN_LABEL[plan]}
    </span>
  );
}

const PERKS: Record<Plan, string[]> = {
  FREE: ["2 bài học đầu mỗi nhạc cụ", "Câu hỏi ôn tập của bài đã mở"],
  BASIC: ["Toàn bộ bài Cơ bản & Trung cấp", "Câu hỏi ôn tập không giới hạn"],
  PRO: ["Tất cả bài học, kể cả Nâng cao", "Lưu lịch sử chấm điểm vĩnh viễn"],
};

/** Paywall: so sánh gói, nhấn mạnh gói tối thiểu cần để mở nội dung. Không bao giờ là ngõ cụt. */
export function UpgradeDialog({
  open,
  onOpenChange,
  requiredPlan = "BASIC",
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlan?: Plan;
  reason?: string;
}) {
  const plans = usePlans();
  const paid = (plans.data ?? []).filter((p) => p.plan !== "FREE");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-fraunces)] text-2xl">Mở khóa để học tiếp</DialogTitle>
          <DialogDescription>
            {reason ?? `Nội dung này cần gói ${PLAN_LABEL[requiredPlan]} trở lên.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {paid.map((p) => {
            const recommended = p.plan === requiredPlan || (requiredPlan === "FREE" && p.plan === "BASIC");
            return (
              <div
                key={p.plan}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4",
                  recommended && "border-primary bg-secondary/40 ring-1 ring-primary/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <PlanBadge plan={p.plan} />
                  {recommended && <span className="text-xs font-medium text-primary">Phù hợp</span>}
                </div>
                <p className="text-2xl font-semibold tabular">
                  {formatVnd(p.priceVnd)}
                  <span className="text-sm font-normal text-muted-foreground"> / {p.durationDays} ngày</span>
                </p>
                <ul className="space-y-1.5 text-sm">
                  {[...PERKS[p.plan], `${p.aiMonthlyQuota} lượt AI chấm điểm / tháng`].map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/pricing?plan=${p.plan}`}
                  className={cn(buttonVariants({ variant: recommended ? "default" : "outline" }), "mt-auto h-9")}
                  onClick={() => onOpenChange(false)}
                >
                  Chọn {PLAN_LABEL[p.plan]}
                </Link>
              </div>
            );
          })}
          {plans.isLoading && <p className="text-sm text-muted-foreground">Đang tải bảng giá…</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
