"use client";

import { ArrowLeft, History, MessageSquareQuote, Mic } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ErrorState, ListSkeleton } from "@/components/app/states";
import { ContourChart } from "@/components/practice/contour-chart";
import { ScoreRing, SubScore } from "@/components/practice/score";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime, formatSeconds, instrumentColor } from "@/lib/format";
import { useInstruments, usePerformance } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ResultView({ id }: { id: string }) {
  const { data, isLoading, isError, error, refetch } = usePerformance(id);
  const instruments = useInstruments();
  if (isLoading) return <ListSkeleton rows={6} />;
  if (isError || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  const instrument = instruments.data?.find((i) => i.slug === data.instrumentSlug);
  const accent = instrumentColor(instrument?.color);
  const m = data.metrics;
  const deviations = m.noteDeviations ?? [];
  const [headline, ...details] = data.feedback;

  return (
    <div style={{ "--inst": accent } as CSSProperties} className="space-y-8">
      <Link href="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Lịch sử luyện tập
      </Link>

      <section className="grid items-center gap-8 rounded-3xl border bg-card p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        <div className="mx-auto"><ScoreRing score={data.overall} /></div>
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--inst)]">
              {instrument?.name ?? data.instrumentSlug} · {data.songTitle}
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">{headline ?? "Kết quả chấm điểm"}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(data.createdAt)}
              {m.durationSeconds ? ` · ${formatSeconds(m.durationSeconds)}` : ""}
              {m.notesEvaluated ? ` · ${m.notesEvaluated} nốt được phân tích` : ""}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <SubScore label="Cao độ" hint={m.meanDeviationCents !== undefined ? `Lệch TB ${Math.round(m.meanDeviationCents)} cent` : "Độ chuẩn nốt"} score={data.pitchScore} />
            <SubScore label="Nhịp" hint="So với bản mẫu" score={data.rhythmScore} />
            <SubScore label="Ổn định" hint="Giữ nốt không chao" score={data.stabilityScore} />
          </div>
        </div>
      </section>

      {m.referenceDurationSeconds !== undefined && m.matchedStart !== undefined && m.matchedEnd !== undefined && (
        <PieceCoverage start={m.matchedStart} end={m.matchedEnd} total={m.referenceDurationSeconds} percent={m.coveragePercent ?? 0} />
      )}

      {m.chart && m.chart.times.length > 0 && (
        <section aria-labelledby="contour" className="space-y-3 rounded-3xl border bg-card p-6">
          <h2 id="contour" className="text-xl font-semibold">Đường cao độ</h2>
          <ContourChart chart={m.chart} deviations={deviations} targetLabel="Bản mẫu" />
        </section>
      )}

      {details.length > 0 && (
        <section aria-labelledby="feedback" className="space-y-3">
          <h2 id="feedback" className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquareQuote className="size-5 text-[color:var(--inst)]" aria-hidden /> Nhận xét
          </h2>
          <ul className="space-y-2">
            {details.map((line, i) => (
              <li
                key={i}
                className={cn(
                  "rounded-xl border bg-card px-4 py-3 text-sm",
                  line.startsWith("•") && "ml-4 border-dashed bg-transparent",
                )}
              >
                {line.replace(/^•\s*/, "")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/practice?instrument=${data.instrumentSlug}&song=${data.songId}`} className={cn(buttonVariants(), "h-10 px-5")}>
          <Mic aria-hidden /> Luyện lại
        </Link>
        <Link href="/history" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5")}>
          <History aria-hidden /> Xem tiến bộ
        </Link>
      </div>
    </div>
  );
}

/** Vị trí đoạn người học đã chơi trên toàn bộ tác phẩm. */
function PieceCoverage({ start, end, total, percent }: { start: number; end: number; total: number; percent: number }) {
  const left = total > 0 ? Math.min(100, (start / total) * 100) : 0;
  const width = total > 0 ? Math.max(1.5, Math.min(100 - left, ((end - start) / total) * 100)) : 0;
  const full = percent >= 90;
  return (
    <section aria-labelledby="coverage" className="space-y-3 rounded-3xl border bg-card p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="coverage" className="text-xl font-semibold">Đoạn đã chơi</h2>
        <p className="text-sm text-muted-foreground tabular">
          {full ? "Cả tác phẩm" : `${formatSeconds(start)}–${formatSeconds(end)} · ${percent}% tác phẩm`}
        </p>
      </div>
      <div
        className="relative h-3 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Đã chơi từ ${formatSeconds(start)} đến ${formatSeconds(end)} trên tổng ${formatSeconds(total)}`}
      >
        <div className="absolute inset-y-0 rounded-full bg-[color:var(--inst)]" style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular">
        <span>0:00</span>
        <span>{formatSeconds(total)}</span>
      </div>
    </section>
  );
}
