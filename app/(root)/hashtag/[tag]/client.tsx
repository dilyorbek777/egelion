"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HashtagPageClientProps {
  tag: string;
}

export function HashtagPageClient({ tag }: HashtagPageClientProps) {
  const posts = useQuery(api.posts.searchByHashtag, { tag });
  const trendingHashtags = useQuery(api.posts.getTrendingHashtags, { limit: 10 });

  if (posts === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Hash className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">#{tag}</h1>
          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>

      {/* Trending Hashtags */}
      {trendingHashtags && trendingHashtags.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Trending Hashtags
          </h2>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map(({ tag: trendingTag, count }) => (
              <Link key={trendingTag} href={`/hashtag/${trendingTag}`}>
                <Button
                  variant={trendingTag === tag ? "default" : "secondary"}
                  size="sm"
                  className="rounded-full"
                >
                  #{trendingTag}
                  <span className="ml-1 text-xs opacity-70">({count})</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Hash className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">No posts found</p>
              <p className="text-muted-foreground">
                There are no posts with the hashtag <strong>#{tag}</strong> yet.
              </p>
            </div>
            <Link href="/create-post">
              <Button className="mt-4">Create Post</Button>
            </Link>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
