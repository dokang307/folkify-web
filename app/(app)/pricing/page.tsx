"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, Loader2, Minus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { PlanBadge } from "@/components/app/plan";
import { ErrorState, ListSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { Plan, PlanInfo } from "@/lib/api/types";
import { PLAN_LABEL, formatDate, formatVnd } from "@/lib/format";
import { useEntitlements, usePlans } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Row = { label: string; value: (p: PlanInfo) => string | boolean };

const ROWS: Row[] = [
  { label: "Bài học", value: (p) => ({ FREE: "2 bài đầu / nhạc cụ", BASIC: "Cơ bản & Trung cấp", PRO: "Tất cả, kể cả Nâng cao" })[p.plan] },
  { label: "Câu hỏi ôn tập", value: (p) => p.plan !== "FREE" || "Bài đã mở" },
  { label: "AI chấm điểm / tháng", value: (p) => (p.aiMonthlyQuota > 0 ? `${p.aiMonthlyQuota} lượt` : false) },
  { label: "Lưu lịch sử chấm", value: (p) => (p.plan === "FREE" ? false : p.historyDays ? `${p.historyDays} ngày` : "Vĩnh viễn") },
  { label: "Biểu đồ cao độ & nhận xét chi tiết", value: (p) => p.plan !== "FREE" },
];

function PricingContent() {
  const params = useSearchParams();
  const highlight = (params.get("plan") as Plan | null) ?? "BASIC";
  const plans = usePlans();
  const entitlements = useEntitlements();
  const current = entitlements.data?.plan;

  const checkout = useMutation({
    mutationFn: (plan: Exclude<Plan, "FREE">) => api.checkout(plan),
    onSuccess: (res) => window.location.assign(res.payUrl),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Không tạo được link thanh toán."),
  });

  if (plans.isLoading) return <ListSkeleton rows={3} />;
  if (plans.isError || !plans.data) return <ErrorState error={plans.error} onRetry={() => plans.refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bảng giá"
        title="Chọn gói phù hợp với nhịp học của bạn"
        description="Thanh toán bằng chuyển khoản QR qua PayOS. Mua lại cùng gói để gia hạn — thời hạn được cộng dồn."
      />
      {current && current !== "FREE" && entitlements.data?.planExpiresAt && (
        <p className="rounded-xl bg-secondary px-4 py-3 text-sm">
          Bạn đang dùng gói <strong>{PLAN_LABEL[current]}</strong> đến {formatDate(entitlements.data.planExpiresAt)}.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.data.map((p) => {
          const featured = p.plan === highlight;
          const isCurrent = p.plan === current;
          return (
            <div
              key={p.plan}
              className={cn(
                "relative flex flex-col gap-5 rounded-3xl border bg-card p-6",
                featured && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30",
              )}
            >
              {featured && p.plan !== "FREE" && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">Đề xuất</span>
              )}
              <div className="space-y-1">
                <div className="flex h-6 items-center gap-2">
                  <p className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">{PLAN_LABEL[p.plan]}</p>
                  <PlanBadge plan={p.plan} />
                </div>
                <p className="text-3xl font-semibold tabular">
                  {p.priceVnd > 0 ? formatVnd(p.priceVnd) : "0đ"}
                  {p.priceVnd > 0 && <span className="text-sm font-normal text-muted-foreground"> / {p.durationDays} ngày</span>}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm">
                {ROWS.map((row) => {
                  const v = row.value(p);
                  return (
                    <li key={row.label} className={cn("flex gap-2", v === false && "text-muted-foreground")}>
                      {v === false ? <Minus className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />}
                      <span>
                        {row.label}
                        {typeof v === "string" && <span className="text-muted-foreground"> — {v}</span>}
                        {v === false && <span className="sr-only"> (không có)</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto">
                {p.plan === "FREE" ? (
                  <Button variant="outline" className="h-10 w-full" disabled>
                    {isCurrent ? "Gói hiện tại" : "Miễn phí"}
                  </Button>
                ) : (
                  <Button
                    className="h-10 w-full"
                    variant={featured ? "default" : "outline"}
                    disabled={checkout.isPending}
                    onClick={() => checkout.mutate(p.plan as Exclude<Plan, "FREE">)}
                  >
                    {checkout.isPending && checkout.variables === p.plan && <Loader2 className="animate-spin" aria-hidden />}
                    {isCurrent ? "Gia hạn" : `Nâng cấp ${PLAN_LABEL[p.plan]}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <PricingContent />
    </Suspense>
  );
}
