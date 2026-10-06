import { InstrumentView } from "@/components/learn/instrument-view";

export default async function InstrumentPage({ params }: PageProps<"/instruments/[slug]">) {
  const { slug } = await params;
  return <InstrumentView slug={slug} />;
}
