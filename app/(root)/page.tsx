"use client";
import { useUser } from "@clerk/nextjs";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { StoryBar } from "@/components/story-bar";
import { PageLoading, PostCardSkeletonList } from "@/components/loading";

export default function HomePage() {
  const { user } = useUser();
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    results: posts,
    status,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
    api.posts.getFeed,
    {},
    { initialNumItems: 6 }
  );

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === "CanLoadMore") {
          loadMore(6);
        }
      },
      { rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [status, loadMore]);

  if (!user) {
    return <PageLoading text="Loading your feed..." />;
  }

  return (
    <div className="max-w-xl mx-auto pb-8">
      
      <StoryBar />
      <div className="px-4 py-4 space-y-4">
        <CreatePost />
        {posts === undefined ? (
          <PostCardSkeletonList count={3} />
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
        {isLoading && <PostCardSkeletonList count={2} />}
        <div ref={loadMoreRef} className="h-4" />
      </div>
    </div>
  );
}
