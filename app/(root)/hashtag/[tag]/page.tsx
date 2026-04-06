import type { Metadata } from "next";
import { HashtagPageClient } from "./client";

interface HashtagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: HashtagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} | Egelion`,
    description: `Explore posts tagged with #${tag} on Egelion.`,
  };
}

export default async function HashtagPage({ params }: HashtagPageProps) {
  const { tag } = await params;
  return <HashtagPageClient tag={tag} />;
}
