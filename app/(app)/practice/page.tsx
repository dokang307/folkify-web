import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/app/states";
import { PracticeView } from "@/components/practice/practice-view";

export const metadata: Metadata = { title: "Luyện tập" };

export default function PracticePage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <PracticeView />
    </Suspense>
  );
}
