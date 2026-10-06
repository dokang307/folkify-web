"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ListSkeleton } from "@/components/app/states";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api/endpoints";
import { PLAN_LABEL } from "@/lib/format";
import { qk } from "@/lib/queries";
import { cn } from "@/lib/utils";

const POLL_MS = 2500;
const MAX_POLLS = 48; // ~2 phút — webhook PayOS thường về trong vài giây

function ResultContent() {
  const params = useSearchParams();
  const orderId = params.get("orderCode");
  const cancelled = params.get("cancel") === "true";
  const queryClient = useQueryClient();

  const status = useQuery({
    queryKey: ["payment-status", orderId],
    queryFn: () => api.paymentStatus(orderId!),
    enabled: !!orderId && !cancelled,
    refetchInterval: (q) =>
      q.state.data?.status === "PENDING" && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false,
  });

  const state = status.data?.status;
  useEffect(() => {
    if (state === "SUCCESS") queryClient.invalidateQueries({ queryKey: qk.entitlements });
  }, [state, queryClient]);

  if (!orderId) {
    return <Message icon={XCircle} title="Không tìm thấy giao dịch" body="Liên kết thanh toán không hợp lệ." />;
  }
  if (state === "FAILED") {
    return <Message icon={XCircle} title="Giao dịch cần kiểm tra" body="Đã nhận tiền nhưng kích hoạt gói gặp lỗi. Vui lòng liên hệ hỗ trợ kèm mã giao dịch để được xử lý." />;
  }
  if (cancelled || state === "CANCELLED") {
    return <Message icon={XCircle} title="Thanh toán chưa hoàn tất" body="Giao dịch đã bị hủy hoặc hết hạn. Bạn chưa bị trừ tiền." retry />;
  }
  if (state === "SUCCESS") {
    return (
      <Message
        icon={CheckCircle2}
        tone="success"
        title={`Chào mừng đến gói ${PLAN_LABEL[status.data!.targetPlan]}!`}
        body="Gói đã được kích hoạt. Các bài học và lượt AI chấm điểm mới đã sẵn sàng."
      />
    );
  }
  const pollCount = queryClient.getQueryState(["payment-status", orderId])?.dataUpdateCount ?? 0;
  const timedOut = state === "PENDING" && pollCount >= MAX_POLLS;
  return timedOut ? (
    <Message icon={Clock} title="Đang chờ xác nhận từ ngân hàng" body="Nếu bạn đã chuyển khoản, gói sẽ được kích hoạt trong ít phút. Bạn có thể quay lại sau." />
  ) : (
    <Message icon={Loader2} spin title="Đang xác nhận thanh toán…" body="Vui lòng không đóng trang này." />
  );
}

function Message({
  icon: Icon,
  title,
  body,
  tone,
  spin,
  retry,
}: {
  icon: typeof Clock;
  title: string;
  body: string;
  tone?: "success";
  spin?: boolean;
  retry?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border bg-card px-6 py-14 text-center" role="status">
      <Icon className={cn("size-12", tone === "success" ? "text-success" : "text-muted-foreground", spin && "animate-spin")} aria-hidden />
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <div className="flex gap-2">
        {retry && <Link href="/pricing" className={cn(buttonVariants(), "h-9")}>Thử lại</Link>}
        <Link href="/" className={cn(buttonVariants({ variant: retry ? "outline" : "default" }), "h-9")}>Về trang chủ</Link>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={2} />}>
      <ResultContent />
    </Suspense>
  );
}
