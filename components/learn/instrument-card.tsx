import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { InstrumentSummary } from "@/lib/api/types";
import { instrumentColor } from "@/lib/format";
import { instrumentImage } from "@/lib/instrument-images";

export function InstrumentCard({ instrument, progress }: { instrument: InstrumentSummary; progress?: number }) {
  const image = instrumentImage(instrument.slug);
  return (
    <Link
      href={`/instruments/${instrument.slug}`}
      style={{ "--inst": instrumentColor(instrument.color) } as CSSProperties}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[color:var(--inst)]/10 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[color:var(--inst)]/10">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
          />
        ) : (
          <span aria-hidden className="grid h-full place-items-center text-5xl">{instrument.emoji}</span>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-[color:var(--inst)]" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-semibold">{instrument.name}</h3>
            <p className="text-xs text-muted-foreground">{instrument.category} · {instrument.lessonCount} bài học</p>
          </div>
          <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-[color:var(--inst)]" aria-hidden />
        </div>
        {instrument.shortDesc && <p className="line-clamp-2 text-sm text-muted-foreground">{instrument.shortDesc}</p>}
        {progress !== undefined && (
          <div className="mt-auto pt-2" aria-label={`Đã học ${Math.round(progress)}%`}>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[color:var(--inst)]" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
