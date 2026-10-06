"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Star, Trophy } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, ListSkeleton } from "@/components/app/states";
import { request } from "@/lib/api/client";
import { instrumentColor } from "@/lib/format";
import { useProgress } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface AchievementItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  unlockedAt: string | null;
}

export default function ProgressPage() {
  const progress = useProgress();
  const achievements = useQuery({
    queryKey: ["achievements"],
    queryFn: () => request<{ unlocked: AchievementItem[]; locked: AchievementItem[] }>("/api/progress/achievements"),
  });

  if (progress.isLoading) return <ListSkeleton />;
  if (progress.isError || !progress.data) return <ErrorState error={progress.error} onRetry={() => progress.refetch()} />;
  const p = progress.data;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Tiến độ" title="Bạn đã đi được bao xa" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Star, label: "Tổng XP", value: p.totalXp.toLocaleString("vi-VN"), cls: "text-gold" },
          { icon: Trophy, label: "Bài đã học", value: p.totalLessonsCompleted, cls: "text-primary" },
          { icon: Flame, label: "Chuỗi hiện tại", value: `${p.currentStreak} ngày`, cls: "text-lacquer" },
          { icon: Award, label: "Chuỗi dài nhất", value: `${p.longestStreak} ngày`, cls: "text-lacquer" },
        ].map(({ icon: Icon, label, value, cls }) => (
          <div key={label} className="rounded-3xl border bg-card p-5">
            <Icon className={cn("size-5", cls)} aria-hidden />
            <p className="mt-3 font-[family-name:var(--font-fraunces)] text-2xl font-semibold tabular">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Theo nhạc cụ</h2>
        <ul className="space-y-2">
          {p.instruments.map((i) => (
            <li key={i.slug}>
              <Link
                href={`/instruments/${i.slug}`}
                style={{ "--inst": instrumentColor(i.color) } as CSSProperties}
                className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-3 hover:bg-muted"
              >
                <span className="text-2xl" aria-hidden>{i.emoji}</span>
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="flex justify-between text-sm">
                    <span className="font-medium">{i.name}</span>
                    <span className="text-muted-foreground tabular">{i.completedLessons}/{i.totalLessons}</span>
                  </span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-[color:var(--inst)]" style={{ width: `${i.progressPercent}%` }} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {achievements.data && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Thành tích</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...achievements.data.unlocked, ...achievements.data.locked].map((a) => {
              const unlocked = achievements.data.unlocked.some((u) => u.id === a.id);
              return (
                <div key={a.id} className={cn("flex gap-3 rounded-2xl border p-4", unlocked ? "bg-card" : "opacity-55")}>
                  <span className="text-2xl" aria-hidden>{a.icon ?? "🏅"}</span>
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
