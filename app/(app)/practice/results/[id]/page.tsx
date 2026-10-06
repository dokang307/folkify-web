import { ResultView } from "@/components/practice/result-view";

export default async function ResultPage({ params }: PageProps<"/practice/results/[id]">) {
  const { id } = await params;
  return <ResultView id={id} />;
}
