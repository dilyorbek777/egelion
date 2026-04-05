"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Clock, ArrowLeft, Trash2, Heart, MoreVertical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StoriesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const clerkId = user?.id ?? "";
  
  // Get user's stories
  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  
  const allStories = useQuery(
    api.stories.getMyStories,
    clerkId ? { clerkId } : "skip"
  );
  
  const deleteStory = useMutation(api.stories.remove);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }
  }, [isLoaded, user, router]);

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
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Your Stories</h1>
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

  // Filter only active stories
  const activeStories = allStories?.filter((story: any) => story.status === "active") || [];

  const handleDeleteClick = (storyId: string) => {
    setStoryToDelete(storyId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!storyToDelete || !clerkId) return;
    await deleteStory({ storyId: storyToDelete as Id<"stories">, clerkId });
    setDeleteDialogOpen(false);
    setStoryToDelete(null);
  };

  const handlePreview = (story: any) => {
    setSelectedStory(story);
    setPreviewOpen(true);
  };

  const getTimeAgo = (createdAt: number) => {
    const hoursAgo = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60));
    if (hoursAgo < 1) {
      const minutesAgo = Math.floor((Date.now() - createdAt) / (1000 * 60));
      return `${minutesAgo}m ago`;
    }
    return `${hoursAgo}h ago`;
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Your Stories</h1>
        </div>
        <Button asChild>
          <Link href="/create-story">Create Story</Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <Button variant="default" size="sm">
          Active
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/stories/archived">Archived</Link>
        </Button>
      </div>

      {activeStories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No active stories. Create a new story to share with your followers!
            </p>
            <Button asChild>
              <Link href="/">Create Story</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeStories.map((story: any) => (
            <Card key={story._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={dbUser.profileImage ?? undefined} />
                      <AvatarFallback>
                        {dbUser.fullName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{dbUser.username}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(story.createdAt)}
                        {story.privacy === "followers" && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            Followers only
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePreview(story)}>
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(story._id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  {story.mediaType === "video" ? (
                    <video
                      src={story.mediaUrl}
                      className="w-full max-h-64 object-contain"
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={story.mediaUrl}
                      alt="Story"
                      className="w-full max-h-64 object-contain"
                    />
                  )}
                  
                  {/* Overlay with stats */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4 text-white">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {story.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {story.likeCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
                
                {story.caption && (
                  <p className="mt-3 text-sm">{story.caption}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {selectedStory && (
            <div className="relative bg-black">
              {selectedStory.mediaType === "video" ? (
                <video
                  src={selectedStory.mediaUrl}
                  className="w-full max-h-[80vh] object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={selectedStory.mediaUrl}
                  alt="Story"
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
              
              {selectedStory.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
                  <p className="text-white text-center">{selectedStory.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
