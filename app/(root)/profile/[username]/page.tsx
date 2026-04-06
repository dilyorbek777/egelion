import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { ProfilePageClient } from "./client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profileUser = await convex.query(api.users.getByUsername, { username });

  if (!profileUser) {
    return {
      title: "User Not Found | Egelion",
    };
  }

  return {
    title: `${profileUser.fullName} (@${profileUser.username}) | Egelion`,
    description: profileUser.bio || `View ${profileUser.fullName}'s profile on Egelion`,
    openGraph: profileUser.profileImage ? {
      images: [profileUser.profileImage],
    } : undefined,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profileUser = await convex.query(api.users.getByUsername, { username });

  if (!profileUser) {
    notFound();
  }

  return <ProfilePageClient username={username} />;
}