"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pencil, Save, X, Camera, MapPin, Calendar,
  Link as LinkIcon, Grid3X3, PlayCircle, Settings,
  UserPlus, UserCheck, Bookmark,
} from "lucide-react";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import Link from "next/link";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setUsername(p.username));
  }, [params]);

  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);
  const router = useRouter();

  const updateProfile = useMutation(api.users.updateProfile);
  const toggleFollow = useMutation(api.interactions.toggleFollow);
  const { startUpload } = useUploadThing("profileImage");

  const profileUser = useQuery(
    api.users.getByUsername,
    username ? { username } : "skip"
  );

  const posts = useQuery(
    api.posts.getByUser,
    profileUser?._id ? { userId: profileUser._id } : "skip"
  );

  const followStats = useQuery(
    api.interactions.getFollowStats,
    profileUser?._id ? { userId: profileUser._id } : "skip"
  );

  const isFollowing = useQuery(
    api.interactions.isFollowing,
    user?.id && profileUser?._id ? { clerkId: user.id, targetUserId: profileUser._id } : "skip"
  );

  const savedPosts = useQuery(
    api.interactions.getSavedPosts,
    user?.id && profileUser?.clerkId === user.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (username && profileUser === null) {
      setNotFound(true);
    }
  }, [username, profileUser]);

  // ── Loading ────────────────────────────────────────────
  if (!username || profileUser === undefined) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-muted" />
            <div className="space-y-3 flex-1">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-20 w-full bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────
  if (notFound || profileUser === null) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-4xl">👤</p>
        <h1 className="text-2xl font-semibold">User not found</h1>
        <p className="text-muted-foreground text-sm">
          No account exists with username{" "}
          <span className="font-mono">@{username}</span>
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    );
  }

  // ── Derived state ──────────────────────────────────────
  const isOwner = !!(user?.id && profileUser.clerkId === user.id);
  const videos = posts?.filter((p) => p.mediaType === "video") ?? [];
  const nonVideoPosts = posts?.filter((p) => p.mediaType !== "video") ?? [];
  const totalPosts = posts?.length ?? 0;
  const totalLikes = posts?.reduce((sum, p) => sum + p.likesCount, 0) ?? 0;
  const followersCount = followStats?.followersCount ?? 0;
  const followingCount = followStats?.followingCount ?? 0;

  const handleMessageClick = async () => {
    if (!user?.id || !profileUser) return;
    try {
      const conversationId = await getOrCreateConversation({
        clerkId: user.id,
        otherUserId: profileUser._id,
      });
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleFollow = async () => {
    if (!user?.id || !profileUser?._id) return;
    try {
      await toggleFollow({
        clerkId: user.id,
        targetUserId: profileUser._id,
      });
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  };

  const handleEditProfile = () => {
    setEditFullName(profileUser.fullName);
    setEditBio(profileUser.bio ?? "");
    setEditLocation(profileUser.location ?? "");
    setEditWebsite(profileUser.website ?? "");
    setEditUsername(profileUser.username);
    setUsernameError(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validate username before saving
    if (editUsername !== profileUser.username && !validateUsername(editUsername)) {
      return;
    }

    try {
      const updated = await updateProfile({
        clerkId: user.id,
        fullName: editFullName,
        bio: editBio,
        location: editLocation,
        website: editWebsite,
        username: editUsername,
      });
      setIsEditingProfile(false);
      setUsernameError(null);

      // Redirect to new username URL if username changed
      if (updated?.username && updated.username !== username) {
        window.location.href = `/profile/${updated.username}`;
      }
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      if (err.message?.includes("taken")) {
        setUsernameError("This username is already taken");
      } else if (err.message?.includes("Username must be")) {
        setUsernameError(err.message);
      } else {
        setUsernameError("Failed to update profile. Please try again.");
      }
    }
  };

  const validateUsername = (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(value)) {
      setUsernameError("Username must be 3-20 characters, letters, numbers, underscores only");
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setUsernameError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setIsUploadingImage(true);
    try {
      const res = await startUpload([file]);
      if (res?.[0]?.url) {
        await updateProfile({ clerkId: user.id, profileImage: res[0].url });
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">

      {/* Profile header */}
      <div className="bg-card rounded-2xl border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">

          {/* Avatar */}
          <div className="relative group w-24 h-24 sm:w-32 sm:h-32 shrink-0">
            {profileUser.profileImage ? (
              <img
                src={profileUser.profileImage}
                alt={profileUser.fullName}
                className="w-full h-full rounded-full object-cover border-4 border-background shadow-lg"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary border-4 border-background shadow-lg">
                {profileUser.fullName[0]}
              </div>
            )}
            {isOwner && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed rounded-full z-10"
                />
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {isUploadingImage ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{profileUser.fullName}</h1>
                <p className="text-muted-foreground">@{profileUser.username}</p>
              </div>

              {isOwner ? (
                <div className="flex gap-2">
                  {isEditingProfile ? (
                    <>
                      <Button size="sm" onClick={handleSaveProfile}>
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEditProfile}>
                        <Pencil className="w-4 h-4 mr-1" /> Edit profile
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/settings">
                          <Settings className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/messages">
                          <MessageSquare className="w-4 h-4 mr-1" /> See messages
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    disabled={!user}
                  >
                    {isFollowing ? (
                      <><UserCheck className="w-4 h-4 mr-1" /> Following</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-1" /> Follow</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMessageClick}
                    disabled={!user}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" /> Message
                  </Button>
                </div>
              )}

              
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              {[
                { label: "Posts", value: totalPosts },
                { label: "Followers", value: followersCount },
                { label: "Following", value: followingCount },
                // { label: "Likes", value: totalLikes },
                // { label: "Videos", value: videos.length },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="font-semibold text-lg">{value}</div>
                  <div className="text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {/* Bio / edit form */}
            {isEditingProfile ? (
              <div className="space-y-3">
                <Input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Full name"
                  className="max-w-sm"
                />
                <div className="max-w-sm">
                  <div className="flex items-center">
                    <span className="text-muted-foreground px-3 py-2 bg-muted border border-r-0 rounded-l-md text-sm">@</span>
                    <Input
                      value={editUsername}
                      onChange={(e) => {
                        setEditUsername(e.target.value.toLowerCase());
                        setUsernameError(null);
                      }}
                      onBlur={() => validateUsername(editUsername)}
                      placeholder="username"
                      className="rounded-l-none"
                    />
                  </div>
                  {usernameError && (
                    <p className="text-destructive text-xs mt-1">{usernameError}</p>
                  )}
                </div>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 border rounded-lg resize-none min-h-[100px] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Location"
                  />
                  <Input
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="Website"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {profileUser.bio && (
                  <p className="text-sm leading-relaxed">{profileUser.bio}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {profileUser.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{profileUser.location}</span>
                    </div>
                  )}
                  {profileUser.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <a
                        href={
                          profileUser.website.startsWith("http")
                            ? profileUser.website
                            : `https://${profileUser.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profileUser.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Joined{" "}
                      {new Date(profileUser._creationTime).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full max-w-md mx-auto ${isOwner ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Posts
            <Badge variant="secondary" className="ml-1">{nonVideoPosts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Videos
            <Badge variant="secondary" className="ml-1">{videos.length}</Badge>
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved
              <Badge variant="secondary" className="ml-1">{savedPosts?.length ?? 0}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {nonVideoPosts.length === 0 ? (
            <EmptyState
              icon={<Grid3X3 className="w-12 h-12" />}
              title="No posts yet"
              message={
                isOwner
                  ? "Share your first post to get started!"
                  : "This user hasn't posted anything yet."
              }
            />
          ) : (
            <div className="grid gap-4">
              {nonVideoPosts.map((post) => (
                <PostCard key={post._id} post={{ ...post, author: profileUser }} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {videos.length === 0 ? (
            <EmptyState
              icon={<PlayCircle className="w-12 h-12" />}
              title="No videos yet"
              message={
                isOwner
                  ? "Share your first video to get started!"
                  : "This user hasn't posted any videos yet."
              }
            />
          ) : (
            <div className="grid gap-4">
              {videos.map((post) => (
                <PostCard key={post._id} post={{ ...post, author: profileUser }} />
              ))}
            </div>
          )}
        </TabsContent>

        {isOwner && (
          <TabsContent value="saved" className="mt-6">
            {!savedPosts ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded" />
                ))}
              </div>
            ) : savedPosts.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="w-12 h-12" />}
                title="No saved posts"
                message="Posts you save will appear here."
              />
            ) : (
              <div className="grid gap-4">
                {savedPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground/30 flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}