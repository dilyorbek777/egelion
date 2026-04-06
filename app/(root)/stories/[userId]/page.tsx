import type { Metadata } from "next";
import { StoryUserPageClient } from "./client";

interface StoryUserPageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: StoryUserPageProps): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `@${userId}'s Stories | Egelion`,
    description: `View stories from @${userId} on Egelion.`,
  };
}

export default async function StoryUserPage({ params }: StoryUserPageProps) {
  const { userId } = await params;
  return <StoryUserPageClient userId={userId} />;
}
