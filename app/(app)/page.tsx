"use client";

import { ArrowRight, Flame, Mic, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PlanBadge } from "@/components/app/plan";
import { CardGridSkeleton } from "@/components/app/states";
import { InstrumentCard } from "@/components/learn/instrument-card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth/use-session";
import { formatDate, instrumentColor } from "@/lib/format";
import { instrumentImage } from "@/lib/instrument-images";
import { useEntitlements, useInstruments, usePerformances, useProgress } from "@/lib/queries";
import { cn } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  return h < 11 ? "Chào buổi sáng" : h < 14 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
}

export default function HomePage() {
  const session = useSession();
  const progress = useProgress();
  const instruments = useInstruments();
  const entitlements = useEntitlements();
  const recent = usePerformances(0);

  const firstName = session?.user.name.trim().split(/\s+/).at(-1) ?? "";
  // "Học tiếp": nhạc cụ đang học dở có tiến độ cao nhất; chưa học gì thì gợi ý nhạc cụ phổ biến nhất
  const inProgress = progress.data?.instruments
    .filter((p) => p.completedLessons > 0 && p.completedLessons < p.totalLessons)
    .sort((a, b) => b.progressPercent - a.progressPercent)[0];
  const continueSlug = inProgress?.slug ?? instruments.data?.[0]?.slug;
  const continueInst = instruments.data?.find((i) => i.slug === continueSlug);
  const lastScore = recent.data?.content[0];
  const quota = entitlements.data?.aiQuota;

  return (
    <div className="space-y-10">
      <section className="space-y-1">
        <p className="text-sm text-muted-foreground">{greeting()}{firstName && `, ${firstName}`}</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Hôm nay mình luyện gì nào?</h1>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {continueInst ? (
          <Link
            href={`/instruments/${continueInst.slug}`}
            style={{ "--inst": instrumentColor(continueInst.color) } as CSSProperties}
            className="group relative isolate flex min-h-52 flex-col justify-end overflow-hidden rounded-3xl bg-[color:var(--inst)] p-6 text-white focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div aria-hidden className="strings-motif absolute inset-0 -z-10 opacity-40 [--inst:white]" />
            {instrumentImage(continueInst.slug) && (
              <Image
                src={instrumentImage(continueInst.slug)!}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="-z-20 object-cover opacity-30 mix-blend-luminosity [mask-image:linear-gradient(to_left,black_20%,transparent_85%)]"
              />
            )}
            <p className="text-sm text-white/80">{inProgress ? "Học tiếp" : "Bắt đầu với"}</p>
            <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold">{continueInst.name}</p>
            {inProgress ? (
              <div className="mt-3 max-w-xs space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white" style={{ width: `${inProgress.progressPercent}%` }} />
                </div>
                <p className="text-xs text-white/80 tabular">{inProgress.completedLessons}/{inProgress.totalLessons} bài</p>
              </div>
            ) : (
              <p className="mt-1 max-w-sm text-sm text-white/85">{continueInst.shortDesc}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
              Vào lộ trình <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        ) : (
          <Skeleton className="min-h-52 rounded-3xl" />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Stat icon={Flame} tone="lacquer" label="Chuỗi ngày" value={progress.data ? `${progress.data.currentStreak}` : null} suffix="ngày" />
          <Stat icon={Star} tone="gold" label="Tổng XP" value={progress.data ? progress.data.totalXp.toLocaleString("vi-VN") : null} />
          <div className="col-span-2 flex flex-col justify-between gap-3 rounded-3xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">AI chấm điểm</p>
              {entitlements.data && <PlanBadge plan={entitlements.data.plan} />}
            </div>
            {!quota ? (
              <Skeleton className="h-6 w-32" />
            ) : quota.limit === 0 ? (
              <p className="text-sm text-muted-foreground">Nâng cấp để AI nghe và chấm phần trình diễn của bạn.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-foreground tabular">{quota.remaining}</span>
                /{quota.limit} lượt còn lại · làm mới {formatDate(quota.resetsAt)}
              </p>
            )}
            <Link
              href={quota?.limit === 0 ? "/pricing" : "/practice"}
              className={cn(buttonVariants({ variant: quota?.limit === 0 ? "default" : "outline" }), "h-9 w-fit")}
            >
              {quota?.limit === 0 ? <><Sparkles aria-hidden /> Xem các gói</> : <><Mic aria-hidden /> Luyện tập ngay</>}
            </Link>
          </div>
        </div>
      </section>

      {lastScore && (
        <Link
          href={`/practice/results/${lastScore.id}`}
          className="flex items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4 transition-colors hover:bg-muted"
        >
          <span className="text-sm">
            <span className="text-muted-foreground">Lần chấm gần nhất · </span>
            {lastScore.songTitle}
          </span>
          <span className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold tabular">{lastScore.overall}</span>
        </Link>
      )}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Nhạc cụ</h2>
          <Link href="/instruments" className="text-sm text-primary hover:underline">Xem tất cả</Link>
        </div>
        {instruments.isLoading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {instruments.data?.slice(0, 6).map((i) => (
              <InstrumentCard
                key={i.id}
                instrument={i}
                progress={progress.data?.instruments.find((p) => p.slug === i.slug)?.progressPercent}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: string | null;
  suffix?: string;
  tone: "lacquer" | "gold";
}) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-3xl border bg-card p-5">
      <Icon className={cn("size-5", tone === "lacquer" ? "text-lacquer" : "text-gold")} aria-hidden />
      <div>
        {value === null ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold tabular">
            {value} {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
