"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Clock, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

interface ArchivedStory {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  privacy: "everyone" | "followers";
  status: "active" | "archived";
  expiresAt: number;
  viewsCount: number;
  authorId: string;
  viewCount: number;
}

export default function ArchivedStoriesPage() {
  const { user } = useUser();
  const router = useRouter();
  const clerkId = user?.id ?? "";
  const archivedStories = useQuery(
    api.stories.getMyArchivedStories,
    clerkId ? { clerkId } : "skip"
  );
  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const deleteStory = useMutation(api.stories.remove);

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
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/stories">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Archived Stories</h1>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dbUser.isProfileComplete) {
    return null;
  }

  const handleDelete = async (storyId: string) => {
    if (!clerkId) return;
    await deleteStory({ storyId: storyId as Id<"stories">, clerkId });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stories">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Archived Stories</h1>
      </div>

      {archivedStories === undefined ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : archivedStories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No archived stories yet. Stories are automatically archived after 24 hours.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {archivedStories.map((story: ArchivedStory) => (
            <Card key={story._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={dbUser.profileImage} />
                      <AvatarFallback>
                        {dbUser.fullName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{dbUser.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Expired {new Date(story.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {story.viewCount}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(story._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {story.mediaType === "video" ? (
                  <video
                    src={story.mediaUrl}
                    className="w-full rounded-lg max-h-96 object-contain bg-black"
                    controls
                  />
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt="Story"
                    className="w-full rounded-lg max-h-96 object-contain bg-black"
                  />
                )}
                {story.caption && (
                  <p className="mt-3 text-sm">{story.caption}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
