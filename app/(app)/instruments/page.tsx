"use client";

import { Music } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/app/states";
import { InstrumentCard } from "@/components/learn/instrument-card";
import { useInstruments, useProgress } from "@/lib/queries";

export default function InstrumentsPage() {
  const instruments = useInstruments();
  const progress = useProgress();
  const progressBySlug = new Map(progress.data?.instruments.map((p) => [p.slug, p.progressPercent]) ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Thư viện bài học"
        title="Chọn nhạc cụ của bạn"
        description="Mỗi nhạc cụ là một lộ trình từ cơ bản đến nâng cao, có video hướng dẫn và câu hỏi ôn tập sau mỗi bài."
      />
      {instruments.isLoading && <CardGridSkeleton />}
      {instruments.isError && <ErrorState error={instruments.error} onRetry={() => instruments.refetch()} />}
      {instruments.data?.length === 0 && <EmptyState icon={Music} title="Chưa có nhạc cụ nào" />}
      {instruments.data && instruments.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instruments.data.map((i) => (
            <InstrumentCard key={i.id} instrument={i} progress={progressBySlug.get(i.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}
