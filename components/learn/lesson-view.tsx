"use client";

import { ArrowLeft, ExternalLink, Lightbulb, ListChecks, Lock, Mic, PencilLine } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { UpgradeDialog } from "@/components/app/plan";
import { ErrorState, ListSkeleton } from "@/components/app/states";
import { YoutubeEmbed } from "@/components/learn/youtube-embed";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, ErrorCodes } from "@/lib/api/client";
import { extractYoutubeId, instrumentColor } from "@/lib/format";
import { useInstrument, useLesson } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function LessonView({ slug, lessonSlug }: { slug: string; lessonSlug: string }) {
  const lesson = useLesson(slug, lessonSlug);
  const instrument = useInstrument(slug);
  const [paywall, setPaywall] = useState(false);
  const accent = instrumentColor(instrument.data?.color);
  const summary = instrument.data?.lessons.find((l) => l.slug === lessonSlug);

  const backLink = (
    <Link href={`/instruments/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> {instrument.data?.name ?? "Lộ trình"}
    </Link>
  );

  if (lesson.isLoading) return <ListSkeleton rows={6} />;

  if (lesson.error instanceof ApiError && lesson.error.code === ErrorCodes.PLAN_REQUIRED) {
    return (
      <div style={{ "--inst": accent } as CSSProperties} className="space-y-6">
        {backLink}
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-secondary"><Lock className="size-6" aria-hidden /></span>
          <h1 className="text-2xl font-semibold">{summary?.title ?? "Bài học đang khóa"}</h1>
          <p className="max-w-md text-muted-foreground">{lesson.error.message}</p>
          <Button onClick={() => setPaywall(true)}>Xem các gói</Button>
        </div>
        <UpgradeDialog open={paywall} onOpenChange={setPaywall} requiredPlan={summary?.requiredPlan ?? "BASIC"} />
      </div>
    );
  }
  if (lesson.isError || !lesson.data) return <ErrorState error={lesson.error} onRetry={() => lesson.refetch()} />;

  const data = lesson.data;
  const videoId = extractYoutubeId(data.youtubeVideoId ?? data.youtubeUrl);
  const ordered = [...(instrument.data?.lessons ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  const next = ordered[ordered.findIndex((l) => l.slug === lessonSlug) + 1];

  return (
    <article style={{ "--inst": accent } as CSSProperties} className="space-y-8">
      {backLink}
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--inst)]">
          {[data.level, data.duration, `${data.xp} XP`].filter(Boolean).join(" · ")}
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{data.title}</h1>
        {data.description && <p className="max-w-3xl text-pretty text-muted-foreground">{data.description}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {videoId ? (
            <YoutubeEmbed videoId={videoId} title={data.title} />
          ) : (
            <div className="grid aspect-video place-items-center rounded-2xl border border-dashed text-sm text-muted-foreground">
              Video cho bài này đang được cập nhật.
            </div>
          )}
          {data.channelName && (
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              Video của kênh <span className="font-medium text-foreground">{data.channelName}</span>
              {data.sourceUrl && (
                <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                  · Xem trên YouTube <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </p>
          )}

          {data.steps.length > 0 && (
            <section aria-labelledby="steps" className="space-y-3">
              <h2 id="steps" className="flex items-center gap-2 text-xl font-semibold">
                <ListChecks className="size-5 text-[color:var(--inst)]" aria-hidden /> Các bước thực hành
              </h2>
              <ol className="space-y-3">
                {data.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[color:var(--inst)]/12 text-sm font-semibold text-[color:var(--inst)] tabular">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">Học xong video?</p>
            <p className="text-sm text-muted-foreground">Làm câu hỏi ôn tập — đạt từ 70% để hoàn thành bài và nhận XP.</p>
            <Link href={`/instruments/${slug}/lessons/${lessonSlug}/quiz`} className={cn(buttonVariants(), "h-10 w-full")}>
              <PencilLine aria-hidden /> Làm câu hỏi ôn tập
            </Link>
            <Link href={`/practice?instrument=${slug}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}>
              <Mic aria-hidden /> Thu âm & để AI chấm
            </Link>
          </div>
          {data.tips.length > 0 && (
            <div className="rounded-2xl bg-[color:var(--inst)]/8 p-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="size-4 text-[color:var(--inst)]" aria-hidden /> Mẹo nhỏ
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {data.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          {next && (
            <Link
              href={`/instruments/${slug}/lessons/${next.slug}`}
              className="block rounded-2xl border p-4 text-sm transition-colors hover:bg-muted"
            >
              <span className="text-xs text-muted-foreground">Bài tiếp theo</span>
              <span className="mt-0.5 flex items-center gap-2 font-medium">
                {next.locked && <Lock className="size-3.5" aria-hidden />} {next.title}
              </span>
            </Link>
          )}
        </aside>
      </div>
    </article>
  );
}
