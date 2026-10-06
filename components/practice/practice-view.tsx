"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Gauge, Lock, Music2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { LockedBadge, UpgradeDialog } from "@/components/app/plan";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Recorder, type Take } from "@/components/practice/recorder";
import { Button } from "@/components/ui/button";
import { ApiError, ErrorCodes } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { Plan, Song } from "@/lib/api/types";
import { formatDate, formatSeconds, instrumentColor } from "@/lib/format";
import { qk, useEntitlements, useInstruments, useSongs } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function PracticeView() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const instruments = useInstruments();
  const entitlements = useEntitlements();
  const [instrumentSlug, setInstrumentSlug] = useState<string | null>(params.get("instrument"));
  const slug = instrumentSlug ?? instruments.data?.[0]?.slug ?? null;
  const songs = useSongs(slug);
  const [songId, setSongId] = useState<string | null>(params.get("song"));
  const [paywall, setPaywall] = useState<Plan | null>(null);

  const instrument = instruments.data?.find((i) => i.slug === slug);
  const accent = instrumentColor(instrument?.color);
  const song = songs.data?.find((s) => s.id === songId && !s.locked && s.scoringReady) ?? null;
  const quota = entitlements.data?.aiQuota;
  const noAi = quota?.limit === 0;
  const exhausted = !!quota && quota.limit > 0 && quota.remaining <= 0;
  const readyCount = songs.data?.filter((s) => s.scoringReady).length ?? 0;

  const submit = useMutation({
    mutationFn: (take: Take) => api.submitPerformance(take.blob, take.filename, song!.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.entitlements });
      queryClient.invalidateQueries({ queryKey: ["performances"] });
      queryClient.setQueryData(qk.performance(result.id), result);
      router.push(`/practice/results/${result.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isPlanGate) setPaywall(song?.requiredPlan ?? "BASIC");
      else if (err instanceof ApiError && err.code === ErrorCodes.AI_QUOTA_EXCEEDED) {
        queryClient.invalidateQueries({ queryKey: qk.entitlements });
        toast.error(err.message);
      } else toast.error(err instanceof ApiError ? err.message : "Không gửi được bản ghi, thử lại nhé.");
    },
  });

  function pick(s: Song) {
    if (s.locked) setPaywall(s.requiredPlan);
    else if (s.scoringReady) setSongId(s.id);
  }

  return (
    <div style={{ "--inst": accent } as CSSProperties} className="space-y-6">
      <PageHeader
        accent={accent}
        eyebrow="AI chấm điểm"
        title="Trình diễn tác phẩm"
        description="Chọn một tác phẩm, chơi một đoạn bất kỳ hoặc cả bài — AI tự nhận ra bạn đang chơi đoạn nào, rồi chấm cao độ, nhịp và độ ổn định."
      />

      {instruments.isError && <ErrorState error={instruments.error} onRetry={() => instruments.refetch()} />}

      <section aria-label="Chọn nhạc cụ" className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {instruments.data?.map((i) => {
            const active = i.slug === slug;
            return (
              <button
                key={i.slug}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setInstrumentSlug(i.slug);
                  setSongId(null);
                }}
                style={{ "--inst": instrumentColor(i.color) } as CSSProperties}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:border-[color:var(--inst)]",
                  active && "border-[color:var(--inst)] bg-[color:var(--inst)] text-white",
                )}
              >
                <span aria-hidden className={cn("size-2.5 rounded-full bg-[color:var(--inst)]", active && "bg-white")} /> {i.name}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section aria-labelledby="choose-song" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 id="choose-song" className="text-lg font-semibold">Tác phẩm</h2>
            {songs.data && songs.data.length > 0 && (
              <span className="text-xs text-muted-foreground tabular">{readyCount}/{songs.data.length} có bản mẫu</span>
            )}
          </div>
          {songs.isLoading && <ListSkeleton rows={3} />}
          {songs.isError && <ErrorState error={songs.error} onRetry={() => songs.refetch()} />}
          {songs.data?.length === 0 && (
            <EmptyState icon={Music2} title="Chưa có tác phẩm" description={`${instrument?.name ?? "Nhạc cụ này"} chưa có tác phẩm nào để luyện.`} />
          )}
          <ul className="space-y-2">
            {songs.data?.map((s) => {
              const active = song?.id === s.id;
              const disabled = !s.locked && !s.scoringReady;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    aria-disabled={disabled}
                    onClick={() => pick(s)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-[border-color,background-color] focus-visible:ring-3 focus-visible:ring-ring/50",
                      !disabled && "hover:border-[color:var(--inst)]/60",
                      active && "border-[color:var(--inst)] bg-[color:var(--inst)]/6",
                      disabled && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--inst)]/10 text-[color:var(--inst)]",
                        active && "bg-[color:var(--inst)] text-white",
                      )}
                    >
                      {active ? <Check className="size-5" aria-hidden /> : s.locked ? <Lock className="size-4" aria-hidden /> : <Music2 className="size-5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[s.artist, s.duration].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {s.locked ? (
                      <LockedBadge plan={s.requiredPlan} />
                    ) : (
                      !s.scoringReady && <span className="shrink-0 text-xs text-muted-foreground">Chưa có bản mẫu</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Trình diễn" className="space-y-4">
          {!song ? (
            <EmptyState
              icon={Music2}
              title="Chọn một tác phẩm để bắt đầu"
              description="Bạn có thể nghe bản mẫu trước, rồi thu âm một câu, một đoạn hoặc cả bài."
            />
          ) : (
            <div className="space-y-3 rounded-2xl border bg-card p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--inst)]">{instrument?.name}</p>
                <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">{song.title}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock3 className="size-3.5" aria-hidden />
                  Bản mẫu {song.referenceDurationSeconds ? formatSeconds(song.referenceDurationSeconds) : song.duration ?? ""}
                  {song.artist && ` · ${song.artist}`}
                </p>
              </div>
              {song.referenceAudioUrl && <audio src={song.referenceAudioUrl} controls preload="none" className="w-full" />}
              {song.attribution && <p className="text-xs text-muted-foreground">Nguồn bản mẫu: {song.attribution}</p>}
            </div>
          )}

          {song &&
            (entitlements.isLoading ? (
              <ListSkeleton rows={2} />
            ) : noAi ? (
              <EmptyState
                icon={Lock}
                title="AI chấm điểm có trong gói Basic và Premium"
                description="Nâng cấp để nhận điểm và nhận xét chi tiết cho phần trình diễn của bạn."
                action={<Button onClick={() => setPaywall("BASIC")}><Sparkles aria-hidden /> Xem các gói</Button>}
              />
            ) : exhausted ? (
              <EmptyState
                icon={Gauge}
                title="Bạn đã dùng hết lượt chấm điểm tháng này"
                description={`Lượt mới sẽ có vào ${formatDate(quota!.resetsAt)}. Nâng cấp Premium để có nhiều lượt hơn.`}
                action={<Button variant="outline" onClick={() => setPaywall("PRO")}>Xem gói Premium</Button>}
              />
            ) : (
              <>
                <Recorder key={song.id} submitting={submit.isPending} onSubmit={(take) => submit.mutate(take)} />
                {quota && (
                  <p className="text-sm text-muted-foreground tabular">
                    Còn <span className="font-medium text-foreground">{quota.remaining}</span>/{quota.limit} lượt chấm trong tháng.
                    Lỗi phân tích không bị trừ lượt.
                  </p>
                )}
              </>
            ))}
        </section>
      </div>

      <UpgradeDialog
        open={paywall !== null}
        onOpenChange={(o) => !o && setPaywall(null)}
        requiredPlan={paywall ?? "BASIC"}
        reason={exhausted && paywall === "PRO" ? "Gói Premium có nhiều lượt AI chấm điểm hơn mỗi tháng." : undefined}
      />
    </div>
  );
}
