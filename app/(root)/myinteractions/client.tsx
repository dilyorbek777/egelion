"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PostCard } from "@/components/post-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, UserPlus, Check, VideoIcon, ImageIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import Link from "next/link";

function UserCard({ 
  user: followingUser, 
  currentUser, 
  onUnfollow 
}: { 
  user: any, 
  currentUser: any, 
  onUnfollow: (userId: Id<"users">) => void 
}) {
  const { user } = useUser();
  
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background hover:border-border transition-all duration-200 gap-3">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-background/50">
            <AvatarImage src={followingUser.profileImage || undefined} alt={followingUser.username} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {followingUser.username?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${followingUser.username}`} className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {followingUser.fullName || followingUser.username}
          </Link>
          <p className="text-xs text-muted-foreground truncate">@{followingUser.username}</p>
          {followingUser.bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{followingUser.bio}</p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUnfollow(followingUser._id)}
        className="sm:ml-2 w-full sm:w-auto"
      >
        <Check className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Following</span>
        <span className="sm:hidden">Unfollow</span>
      </Button>
    </div>
  );
}

export function MyInteractionsClient() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("liked");
  const [contentType, setContentType] = useState<"all" | "images" | "videos">("all");
  
  const toggleFollow = useMutation(api.interactions.toggleFollow);
  
  // Get liked posts
  const likedPosts = useQuery(
    api.interactions.getLikedPosts,
    user ? { clerkId: user.id } : "skip"
  );
  
  // Get saved posts
  const savedPosts = useQuery(
    api.interactions.getSavedPosts,
    user ? { clerkId: user.id } : "skip"
  );
  
  // Get following users
  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  
  const followingUsers = useQuery(
    api.interactions.getFollowing,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const handleUnfollow = async (userId: Id<"users">) => {
    if (!user) return;
    
    try {
      await toggleFollow({ clerkId: user.id, targetUserId: userId });
      toast.success("User unfollowed");
    } catch (error) {
      toast.error("Failed to unfollow user");
    }
  };

  const filterLikedPosts = () => {
    if (!likedPosts) return [];
    if (contentType === "all") return likedPosts;
    return likedPosts.filter(post => post.mediaType === contentType.slice(0, -1) as "image" | "video");
  };

  const filterSavedPosts = () => {
    if (!savedPosts) return [];
    if (contentType === "all") return savedPosts;
    return savedPosts.filter(post => post.mediaType === contentType.slice(0, -1) as "image" | "video");
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground">You need to be signed in to view your interactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Interactions</h1>
        <p className="text-sm sm:text-base text-muted-foreground">View your liked posts, saved posts, and following users</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="liked" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:py-2 sm:px-3">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Liked</span>
            <span className="sm:hidden">Like</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:py-2 sm:px-3">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Saved</span>
            <span className="sm:hidden">Save</span>
          </TabsTrigger>
          <TabsTrigger value="following" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:py-2 sm:px-3">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Following</span>
            <span className="sm:hidden">Follow</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liked" className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                variant={contentType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType("all")}
                className="text-xs sm:text-sm"
              >
                <ImageIcon className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">All</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button
                variant={contentType === "images" ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType("images")}
                className="text-xs sm:text-sm"
              >
                <ImageIcon className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Images</span>
                <span className="sm:hidden">Img</span>
              </Button>
              <Button
                variant={contentType === "videos" ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType("videos")}
                className="text-xs sm:text-sm"
              >
                <VideoIcon className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Videos</span>
                <span className="sm:hidden">Vid</span>
              </Button>
            </div>

            {likedPosts === undefined ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading liked posts...</p>
              </div>
            ) : likedPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No liked posts yet</h3>
                  <p className="text-muted-foreground">Start liking posts to see them here!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filterLikedPosts()?.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                variant={contentType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType("all")}
                className="text-xs sm:text-sm"
              >
                <ImageIcon className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">All</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button
                variant={contentType === "images" ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType("images")}
                className="text-xs sm:text-sm"
              >
                <ImageIcon className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Images</span>
                <span className="sm:hidden">Img</span>
              </Button>
              <Button
                variant={contentType === "videos" ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType("videos")}
                className="text-xs sm:text-sm"
              >
                <VideoIcon className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Videos</span>
                <span className="sm:hidden">Vid</span>
              </Button>
            </div>

            {savedPosts === undefined ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading saved posts...</p>
              </div>
            ) : savedPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
                  <p className="text-muted-foreground">Start saving posts to see them here!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filterSavedPosts()?.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="following" className="space-y-6">
          {followingUsers === undefined ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading following users...</p>
            </div>
          ) : followingUsers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Not following anyone yet</h3>
                <p className="text-muted-foreground">Start following users to see them here!</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Following ({followingUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {followingUsers.map((followingUser) => (
                  <UserCard
                    key={followingUser._id}
                    user={followingUser}
                    currentUser={currentUser}
                    onUnfollow={handleUnfollow}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
