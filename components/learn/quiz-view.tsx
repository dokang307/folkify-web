"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CheckCircle2, Loader2, RotateCcw, Trophy, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { UpgradeDialog } from "@/components/app/plan";
import { ErrorState, ListSkeleton } from "@/components/app/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, ErrorCodes } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { QuizResult } from "@/lib/api/types";
import { instrumentColor } from "@/lib/format";
import { qk, useInstrument } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function QuizView({ slug, lessonSlug }: { slug: string; lessonSlug: string }) {
  const queryClient = useQueryClient();
  const instrument = useInstrument(slug);
  const quiz = useQuery({ queryKey: qk.quiz(slug, lessonSlug), queryFn: () => api.quiz(slug, lessonSlug) });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const accent = instrumentColor(instrument.data?.color);
  const lessonHref = `/instruments/${slug}/lessons/${lessonSlug}`;

  const submit = useMutation({
    mutationFn: () => api.submitQuiz(slug, lessonSlug, answers),
    onSuccess: (r) => {
      setResult(r);
      if (r.completion) {
        queryClient.invalidateQueries({ queryKey: qk.instrument(slug) });
        queryClient.invalidateQueries({ queryKey: qk.progress });
        toast.success(`Hoàn thành bài học! +${r.completion.xpEarned} XP`);
      }
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Không nộp được bài, thử lại nhé."),
  });

  if (quiz.isLoading) return <ListSkeleton rows={4} />;
  if (quiz.error instanceof ApiError && quiz.error.code === ErrorCodes.PLAN_REQUIRED) {
    return <LockedQuiz message={quiz.error.message} />;
  }
  if (quiz.isError || !quiz.data) return <ErrorState error={quiz.error} onRetry={() => quiz.refetch()} />;

  const questions = quiz.data.questions;
  const back = (
    <Link href={lessonHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> Quay lại bài học
    </Link>
  );

  if (result) {
    const byId = new Map(result.results.map((r) => [r.questionId, r]));
    return (
      <div style={{ "--inst": accent } as CSSProperties} className="mx-auto max-w-2xl space-y-6">
        {back}
        <div className={cn("rounded-2xl border p-6 text-center", result.passed ? "bg-success/8" : "bg-card")}>
          {result.passed ? <Trophy className="mx-auto size-10 text-gold" aria-hidden /> : <RotateCcw className="mx-auto size-10 text-muted-foreground" aria-hidden />}
          <p className="mt-3 font-[family-name:var(--font-fraunces)] text-5xl font-semibold tabular">{result.scorePercent}%</p>
          <p className="mt-1 text-muted-foreground">
            Đúng {result.correctCount}/{result.totalCount} câu ·{" "}
            {result.passed ? "Bạn đã qua bài!" : `Cần ${quiz.data.passPercent}% để hoàn thành bài`}
          </p>
          {result.completion && (
            <p className="mt-2 text-sm font-medium text-lacquer">
              +{result.completion.xpEarned} XP · Chuỗi {result.completion.currentStreak} ngày
              {result.completion.newAchievements.map((a) => ` · 🏅 ${a.name}`).join("")}
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {!result.passed && (
              <Button onClick={() => { setResult(null); setAnswers({}); setIndex(0); }}>
                <RotateCcw aria-hidden /> Làm lại
              </Button>
            )}
            <Link href={`/instruments/${slug}`} className={cn(buttonVariants({ variant: result.passed ? "default" : "outline" }), "h-8")}>
              Về lộ trình
            </Link>
          </div>
        </div>
        <ol className="space-y-4">
          {questions.map((q, i) => {
            const r = byId.get(q.id);
            const chosen = new Set(answers[q.id] ?? []);
            const correctIds = new Set(r?.correctOptionIds ?? []);
            return (
              <li key={q.id} className="rounded-2xl border p-4">
                <p className="flex gap-2 font-medium">
                  {r?.correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Đúng" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Sai" />}
                  <span>{i + 1}. {q.question}</span>
                </p>
                <ul className="mt-3 space-y-1.5 pl-7 text-sm">
                  {q.options.map((o) => (
                    <li
                      key={o.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1",
                        correctIds.has(o.id) && "bg-success/10 font-medium",
                        chosen.has(o.id) && !correctIds.has(o.id) && "bg-destructive/10 line-through decoration-destructive/50",
                      )}
                    >
                      {correctIds.has(o.id) ? <Check className="size-4 text-success" aria-hidden /> : chosen.has(o.id) ? <X className="size-4 text-destructive" aria-hidden /> : <span className="size-4" />}
                      {o.text}
                    </li>
                  ))}
                </ul>
                {r?.explanation && <p className="mt-3 rounded-lg bg-muted px-3 py-2 pl-7 text-sm text-muted-foreground">{r.explanation}</p>}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const q = questions[index];
  const selected = answers[q.id] ?? [];
  const isLast = index === questions.length - 1;
  const answeredAll = questions.every((x) => (answers[x.id] ?? []).length > 0);

  function toggle(optionId: string) {
    setAnswers((prev) => {
      const current = prev[q.id] ?? [];
      const nextSel =
        q.type === "SINGLE" ? [optionId] : current.includes(optionId) ? current.filter((x) => x !== optionId) : [...current, optionId];
      return { ...prev, [q.id]: nextSel };
    });
  }

  return (
    <div style={{ "--inst": accent } as CSSProperties} className="mx-auto max-w-2xl space-y-6">
      {back}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Câu {index + 1} / {questions.length}</span>
          <span>{q.type === "MULTI" ? "Chọn tất cả đáp án đúng" : "Chọn 1 đáp án"}</span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {questions.map((x, i) => (
            <span
              key={x.id}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-muted transition-colors",
                (answers[x.id] ?? []).length > 0 && "bg-[color:var(--inst)]/50",
                i === index && "bg-[color:var(--inst)]",
              )}
            />
          ))}
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold leading-snug">{q.question}</legend>
        <div role={q.type === "SINGLE" ? "radiogroup" : "group"} className="space-y-2">
          {q.options.map((o, i) => {
            const on = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                role={q.type === "SINGLE" ? "radio" : "checkbox"}
                aria-checked={on}
                onClick={() => toggle(o.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-[border-color,background-color] duration-150 hover:border-[color:var(--inst)]/60 focus-visible:ring-3 focus-visible:ring-ring/50",
                  on && "border-[color:var(--inst)] bg-[color:var(--inst)]/8",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center border text-xs font-semibold",
                    q.type === "SINGLE" ? "rounded-full" : "rounded-md",
                    on && "border-[color:var(--inst)] bg-[color:var(--inst)] text-white",
                  )}
                >
                  {on ? <Check className="size-4" aria-hidden /> : String.fromCharCode(65 + i)}
                </span>
                {o.text}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Câu trước</Button>
        {isLast ? (
          <Button className="h-10 px-5" disabled={!answeredAll || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending && <Loader2 className="animate-spin" aria-hidden />}
            Nộp bài
          </Button>
        ) : (
          <Button className="h-10 px-5" disabled={selected.length === 0} onClick={() => setIndex((i) => i + 1)}>
            Câu tiếp
          </Button>
        )}
      </div>
      {isLast && !answeredAll && <p className="text-right text-xs text-muted-foreground">Trả lời tất cả câu hỏi để nộp bài.</p>}
    </div>
  );
}

function LockedQuiz({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border p-8 text-center">
      <p className="font-medium">{message}</p>
      <Button onClick={() => setOpen(true)}>Xem các gói</Button>
      <UpgradeDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
