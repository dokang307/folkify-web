"use client";

import { Mic } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateTime, instrumentColor, scoreTone } from "@/lib/format";
import { useEntitlements, useInstruments, usePerformances } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const history = usePerformances(page);
  const instruments = useInstruments();
  const entitlements = useEntitlements();
  const colorOf = (slug: string) => instrumentColor(instruments.data?.find((i) => i.slug === slug)?.color);
  const items = history.data?.content ?? [];
  // Biểu đồ xu hướng: cũ → mới
  const trend = [...items].reverse().map((p, i) => ({ i, overall: p.overall }));
  const windowDays = entitlements.data?.historyDays;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lịch sử"
        title="Hành trình luyện tập"
        description={windowDays ? `Hiển thị các lần chấm trong ${windowDays} ngày gần nhất theo gói của bạn.` : "Tất cả các lần AI đã chấm điểm cho bạn."}
      />
      {history.isLoading && <ListSkeleton />}
      {history.isError && <ErrorState error={history.error} onRetry={() => history.refetch()} />}
      {history.data && items.length === 0 && (
        <EmptyState
          icon={Mic}
          title="Chưa có lần chấm điểm nào"
          description="Chọn một tác phẩm, thu âm một đoạn hoặc cả bài để AI chấm cao độ, nhịp và độ ổn định."
          action={<Link href="/practice" className={cn(buttonVariants(), "h-9")}>Luyện tập ngay</Link>}
        />
      )}
      {items.length > 1 && (
        <section className="rounded-3xl border bg-card p-5" aria-label="Xu hướng điểm">
          <p className="mb-2 text-sm font-medium">Xu hướng điểm tổng</p>
          <div className="h-28">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                  labelFormatter={() => ""}
                  formatter={(v) => [v, "Điểm"]}
                />
                <Line type="monotone" dataKey="overall" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((p) => {
            const tone = scoreTone(p.overall);
            return (
              <li key={p.id}>
                <Link
                  href={`/practice/results/${p.id}`}
                  style={{ "--inst": colorOf(p.instrumentSlug) } as CSSProperties}
                  className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="h-10 w-1 rounded-full bg-[color:var(--inst)]" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.songTitle}</span>
                    <span className="text-xs text-muted-foreground">
                      {instruments.data?.find((i) => i.slug === p.instrumentSlug)?.name ?? p.instrumentSlug}
                      {p.coveragePercent !== null && ` · ${p.coveragePercent >= 90 ? "cả bài" : `${p.coveragePercent}% tác phẩm`}`}
                      {" · "}{formatDateTime(p.createdAt)}
                    </span>
                  </span>
                  <span className="hidden gap-3 text-xs text-muted-foreground sm:flex tabular">
                    <span>Cao độ {p.pitchScore}</span>
                    <span>Nhịp {p.rhythmScore}</span>
                    <span>Ổn định {p.stabilityScore}</span>
                  </span>
                  <span
                    className={cn(
                      "font-[family-name:var(--font-fraunces)] text-2xl font-semibold tabular",
                      tone === "excellent" && "text-gold",
                      tone === "weak" && "text-lacquer",
                    )}
                  >
                    {p.overall}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {history.data && history.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Mới hơn</Button>
          <span className="text-sm text-muted-foreground tabular">Trang {page + 1}/{history.data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= history.data.totalPages} onClick={() => setPage((p) => p + 1)}>Cũ hơn</Button>
        </div>
      )}
    </div>
  );
}
