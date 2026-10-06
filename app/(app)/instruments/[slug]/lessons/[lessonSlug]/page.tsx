import { LessonView } from "@/components/learn/lesson-view";

export default async function LessonPage({ params }: PageProps<"/instruments/[slug]/lessons/[lessonSlug]">) {
  const { slug, lessonSlug } = await params;
  return <LessonView slug={slug} lessonSlug={lessonSlug} />;
}
