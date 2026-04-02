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
      <div className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center gap-1 overflow-x-auto py-3 px-2 scrollbar-hide">
          {/* Add Story Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex flex-col items-center gap-1.5 min-w-[76px] flex-shrink-0 group"
          >
            <div className="relative">
              <div className="w-[64px] h-[64px] rounded-full p-[2px] bg-gradient-to-br from-muted to-muted group-hover:from-primary/20 group-hover:to-primary/40 transition-all duration-300">
                <Avatar className="w-full h-full ring-2 ring-background">
                  <AvatarImage src={dbUser?.profileImage} className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                    {dbUser?.fullName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-background">
                <Plus className="w-3 h-3" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[72px]">
              Your Story
            </span>
          </button>

          {/* Divider */}
          {storyGroups && storyGroups.length > 0 && (
            <div className="w-px h-12 bg-border mx-2 flex-shrink-0" />
          )}

          {/* Story Groups */}
          {storyGroups?.map((group: StoryGroup, index: number) => (
            <button
              key={group.author?._id || index}
              onClick={() => handleStoryClick(index)}
              className="flex flex-col items-center gap-1.5 min-w-[76px] flex-shrink-0 group"
            >
              <div
                className={cn(
                  "w-[64px] h-[64px] rounded-full p-[3px] transition-all duration-300",
                  group.hasUnviewed
                    ? "bg-linear-to-tr from-primary via-cyan-500 to-purple-600 group-hover:from-primary group-hover:via-cyan-400 group-hover:to-purple-500"
                    : "bg-linear-to-br from-muted to-muted/60 group-hover:from-muted-foreground/30 group-hover:to-muted-foreground/50"
                )}
              >
                <Avatar className="w-full h-full ring-2 ring-background transition-transform duration-300 group-hover:scale-[0.96]">
                  <AvatarImage src={group.author?.profileImage} className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                    {group.author?.fullName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className={cn(
                "text-[11px] font-medium truncate max-w-[72px] transition-colors",
                group.hasUnviewed 
                  ? "text-foreground" 
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
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
