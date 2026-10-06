"use client";

import { ArrowLeft, Mic, Ruler, Sparkles, Trees } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, ListSkeleton } from "@/components/app/states";
import { LessonPath } from "@/components/learn/lesson-path";
import { buttonVariants } from "@/components/ui/button";
import { instrumentColor } from "@/lib/format";
import { instrumentImage } from "@/lib/instrument-images";
import { useInstrument } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function InstrumentView({ slug }: { slug: string }) {
  const { data, isLoading, isError, error, refetch } = useInstrument(slug);
  if (isLoading) return <ListSkeleton rows={8} />;
  if (isError || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  const accent = instrumentColor(data.color);
  const image = instrumentImage(data.slug);
  const done = data.lessons.filter((l) => l.completed).length;
  const facts = [
    data.material && { icon: Trees, label: "Chất liệu", value: data.material },
    data.soundRange && { icon: Ruler, label: "Âm vực", value: data.soundRange },
    data.origin && { icon: Sparkles, label: "Nguồn gốc", value: data.origin },
  ].filter(Boolean) as { icon: typeof Trees; label: string; value: string }[];

  return (
    <div style={{ "--inst": accent } as CSSProperties} className="space-y-8">
      <Link href="/instruments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Tất cả nhạc cụ
      </Link>
      <PageHeader
        accent={accent}
        eyebrow={data.category}
        title={data.name}
        description={data.shortDesc}
        actions={
          <Link href={`/practice?instrument=${data.slug}`} className={cn(buttonVariants({ variant: "outline" }), "h-9")}>
            <Mic aria-hidden /> Luyện với AI
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section aria-label="Lộ trình bài học" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold">Lộ trình</h2>
            <p className="text-sm text-muted-foreground tabular">
              {done}/{data.lessons.length} bài đã hoàn thành
            </p>
          </div>
          <LessonPath instrumentSlug={data.slug} lessons={data.lessons} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border">
              <Image src={image} alt={data.name} fill sizes="340px" className="object-cover" />
            </div>
          )}
          {data.description && <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>}
          {facts.length > 0 && (
            <dl className="divide-y rounded-2xl border">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 p-3 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-[color:var(--inst)]" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
          {data.facts.length > 0 && (
            <div className="rounded-2xl bg-[color:var(--inst)]/8 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--inst)]">Có thể bạn chưa biết</p>
              <ul className="space-y-2 text-sm">
                {data.facts.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
