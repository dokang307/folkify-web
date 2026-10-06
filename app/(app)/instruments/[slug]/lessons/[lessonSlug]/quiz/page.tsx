import { QuizView } from "@/components/learn/quiz-view";

export default async function QuizPage({ params }: PageProps<"/instruments/[slug]/lessons/[lessonSlug]/quiz">) {
  const { slug, lessonSlug } = await params;
  return <QuizView slug={slug} lessonSlug={lessonSlug} />;
}
