"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { StoryBar } from "@/components/story-bar";
import { PageLoading, CreatePostSkeleton, PostCardSkeletonList } from "@/components/loading";

export default function HomePage() {
  const { user } = useUser();
  const router = useRouter();
  const dbUser = useQuery(api.users.getByClerkId, { clerkId: user?.id ?? "" });
  const posts = useQuery(api.posts.getFeed, {});

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
    return <PageLoading text="Loading your feed..." />;
  }

  if (!dbUser.isProfileComplete) {
    return <PageLoading text="Setting up your profile..." />;
  }

  return (
    <div className="max-w-xl mx-auto pb-8">
      <StoryBar />
      <div className="px-4 py-4 space-y-4">
        <CreatePost />
        {posts === undefined ? (
          <PostCardSkeletonList count={3} />
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
