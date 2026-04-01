"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { StoryViewer } from "./story-viewer";
import { CreateStory } from "./create-story";

interface StoryGroup {
  author: {
    _id: string;
    username: string;
    profileImage?: string;
    fullName: string;
  } | null;
  stories: {
    _id: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    caption?: string;
    privacy: "everyone" | "followers";
    status: "active" | "archived";
    expiresAt: number;
    viewsCount: number;
    authorId: string;
    hasViewed: boolean;
  }[];
  hasUnviewed: boolean;
}

export function StoryBar() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const storyGroups = useQuery(
    api.stories.getActiveStories,
    clerkId ? { clerkId } : "skip"
  );
  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  if (!user || !dbUser?.isProfileComplete) return null;

  const handleStoryClick = (index: number) => {
    setSelectedGroupIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedGroupIndex(null);
  };

  const handleNext = () => {
    if (
      selectedGroupIndex !== null &&
      storyGroups &&
      selectedGroupIndex < storyGroups.length - 1
    ) {
      setSelectedGroupIndex(selectedGroupIndex + 1);
    } else {
      setSelectedGroupIndex(null);
    }
  };

  const handlePrevious = () => {
    if (selectedGroupIndex !== null && selectedGroupIndex > 0) {
      setSelectedGroupIndex(selectedGroupIndex - 1);
    }
  };

  return (
    <>
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex gap-4 overflow-x-auto py-4 px-4 scrollbar-hide">
          {/* Add Story Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex flex-col items-center gap-1.5 min-w-[72px] flex-shrink-0"
          >
            <div className="relative">
              <Avatar className="w-[60px] h-[60px] ring-2 ring-muted ring-offset-2 ring-offset-background">
                <AvatarImage src={dbUser?.profileImage} />
                <AvatarFallback>
                  {dbUser?.fullName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className="text-xs font-medium truncate max-w-[72px]">
              Your Story
            </span>
          </button>

          {/* Story Groups */}
          {storyGroups?.map((group: StoryGroup, index: number) => (
            <button
              key={group.author?._id || index}
              onClick={() => handleStoryClick(index)}
              className="flex flex-col items-center gap-1.5 min-w-[72px] flex-shrink-0"
            >
              <div
                className={cn(
                  "rounded-full p-[3px]",
                  group.hasUnviewed
                    ? "bg-gradient-to-tr from-teal-400 via-cyan-500 to-blue-500"
                    : "bg-muted"
                )}
              >
                <Avatar className="w-[54px] h-[54px] ring-2 ring-background">
                  <AvatarImage src={group.author?.profileImage} />
                  <AvatarFallback>
                    {group.author?.fullName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs font-medium truncate max-w-[72px]">
                {group.author?.username}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer */}
      {selectedGroupIndex !== null && storyGroups && (
        <StoryViewer
          storyGroups={storyGroups}
          currentGroupIndex={selectedGroupIndex}
          onClose={handleCloseViewer}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}

      {/* Create Story Modal */}
      {isCreating && (
        <CreateStory isOpen={isCreating} onClose={() => setIsCreating(false)} />
      )}
    </>
  );
}
