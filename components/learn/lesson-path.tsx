"use client";

import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LockedBadge, UpgradeDialog } from "@/components/app/plan";
import type { LessonSummary, Plan } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<string, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
};

/** Lộ trình dạng "dây đàn" dọc: các bài là phím trên một sợi dây, nhóm theo cấp độ. */
export function LessonPath({
  instrumentSlug,
  lessons,
}: {
  instrumentSlug: string;
  lessons: LessonSummary[];
}) {
  const [paywall, setPaywall] = useState<Plan | null>(null);
  const groups = new Map<string, LessonSummary[]>();
  for (const lesson of [...lessons].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const key = lesson.level ?? "Khác";
    groups.set(key, [...(groups.get(key) ?? []), lesson]);
  }
  const nextLesson = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex).find((l) => !l.locked && !l.completed);

  return (
    <>
      <div className="space-y-8">
        {[...groups.entries()].map(([level, items]) => (
          <section key={level} aria-labelledby={`level-${level}`}>
            <h2 id={`level-${level}`} className="mb-3 text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {LEVEL_LABEL[level] ?? level}
            </h2>
            <ol className="relative space-y-2 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-[color:var(--inst)]/30">
              {items.map((lesson) => {
                const done = lesson.completed;
                const isNext = nextLesson?.id === lesson.id;
                const body = (
                  <>
                    <span
                      className={cn(
                        "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 bg-background",
                        done && "border-[color:var(--inst)] bg-[color:var(--inst)] text-white",
                        isNext && "border-[color:var(--inst)] text-[color:var(--inst)]",
                        lesson.locked && "border-dashed text-muted-foreground",
                      )}
                    >
                      {done ? <CheckCircle2 className="size-5" aria-hidden /> : lesson.locked ? <Lock className="size-4" aria-hidden /> : <PlayCircle className="size-5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{lesson.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {[lesson.duration, `${lesson.xp} XP`].filter(Boolean).join(" · ")}
                        {done && " · Đã hoàn thành"}
                      </span>
                    </span>
                    {lesson.locked ? (
                      <LockedBadge plan={lesson.requiredPlan} />
                    ) : (
                      isNext && <span className="rounded-full bg-[color:var(--inst)] px-2.5 py-0.5 text-xs font-medium text-white">Học tiếp</span>
                    )}
                  </>
                );
                const rowClass = cn(
                  "flex w-full items-center gap-3 rounded-xl px-1 py-2 pr-3 text-left transition-colors hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50",
                  isNext && "bg-[color:var(--inst)]/8",
                );
                return (
                  <li key={lesson.id}>
                    {lesson.locked ? (
                      <button type="button" className={rowClass} onClick={() => setPaywall(lesson.requiredPlan)}>
                        {body}
                      </button>
                    ) : (
                      <Link href={`/instruments/${instrumentSlug}/lessons/${lesson.slug}`} className={rowClass}>
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
      <UpgradeDialog open={paywall !== null} onOpenChange={(o) => !o && setPaywall(null)} requiredPlan={paywall ?? "BASIC"} />
    </>
  );
}
