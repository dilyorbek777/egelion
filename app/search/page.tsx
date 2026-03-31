"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/post-card";
import { PostCardSkeletonList } from "@/components/loading";
import Link from "next/link";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const posts = useQuery(api.posts.getFeed, {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`);
    }
  };

  const mediaPosts = posts?.filter((p) => p.mediaUrl) ?? [];
  const textPosts = posts?.filter((p) => !p.mediaUrl) ?? [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="Search posts, users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!query.trim()}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </form>

      {/* Posts Sections */}
      {posts === undefined ? (
        <PostCardSkeletonList count={6} />
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts found</p>
      ) : (
        <div className="space-y-8">
          {/* Media Posts Grid */}
          {mediaPosts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Recent Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaPosts.slice(0, 6).map((post) => (
                  // <Link key={post._id} href={`/post/${post._id}`}>
                    <PostCard key={post._id} post={post} />
                    

                  // {/* </Link> */}
                ))}
              </div>
            </section>
          )}

          {/* Text Posts as Tweets */}
          {textPosts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Recent Tweets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {textPosts.slice(0, 6).map((post) => (
                  <Link key={post._id} href={`/post/${post._id}`}>
                    <div className="border rounded-lg p-4 hover:bg-muted transition-colors h-full">
                      <p className="text-sm line-clamp-4">{post.content}</p>
                      {post.author && (
                        <p className="text-xs text-muted-foreground mt-2">@{post.author.username}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
