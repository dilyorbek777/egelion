"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { User, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsPageProps {
  params: Promise<{ content: string }>;
}

export default function SearchResultsPage({ params }: SearchResultsPageProps) {
  const resolvedParams = React.use(params);
  const content = decodeURIComponent(resolvedParams.content);
  
  const posts = useQuery(api.posts.search, { query: content });
  const users = useQuery(api.users.search, { query: content });

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/search">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Search className="w-5 h-5" />
          &quot;{content}&quot;
        </h1>
      </div>

      {/* Users Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Users</h2>
        {users === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <Link
                key={user._id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Posts Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Posts</h2>
        {posts === undefined ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts found</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import React from "react";
