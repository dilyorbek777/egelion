"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CreatePost } from "@/components/create-post";
import { PageLoading } from "@/components/loading";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreatePostPage() {
  const { user } = useUser();
  const router = useRouter();
  const dbUser = useQuery(api.users.getByClerkId, { clerkId: user?.id ?? "" });

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (dbUser && !dbUser.isProfileComplete) {
      router.push("/profile-complete");
    }
  }, [dbUser, router]);

  if (!user || !dbUser) {
    return <PageLoading text="Loading..." />;
  }

  if (!dbUser.isProfileComplete) {
    return <PageLoading text="Setting up your profile..." />;
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/"
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Create Post</h1>
      </div>
      <CreatePost />
    </div>
  );
}
