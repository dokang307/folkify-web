"use client";

import { SCORE_TONE_LABEL, scoreTone } from "@/lib/format";
import { cn } from "@/lib/utils";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreRing({ score, size = 168 }: { score: number; size?: number }) {
  const tone = scoreTone(score);
  const offset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Điểm tổng ${score}/100 — ${SCORE_TONE_LABEL[tone]}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-[var(--ease-out)] motion-reduce:transition-none",
            tone === "excellent" && "stroke-[color:var(--gold)]",
            tone === "good" && "stroke-[color:var(--inst)]",
            tone === "fair" && "stroke-[color:var(--warning)]",
            tone === "weak" && "stroke-[color:var(--lacquer)]",
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-none tabular">{score}</p>
          <p className="mt-1 text-xs text-muted-foreground">{SCORE_TONE_LABEL[tone]}</p>
        </div>
      </div>
    </div>
  );
}

export function SubScore({ label, hint, score }: { label: string; hint: string; score: number | null }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular">{score ?? "—"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        {score !== null && (
          <div className="h-full rounded-full bg-[color:var(--inst)] transition-[width] duration-700" style={{ width: `${score}%` }} />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
