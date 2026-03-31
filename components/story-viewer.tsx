"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Users,
  MoreVertical,
  Trash2,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Story {
  _id: Id<"stories">;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  privacy: "everyone" | "followers";
  status: "active" | "archived";
  expiresAt: number;
  viewsCount: number;
  likesCount?: number;
  authorId: string;
  hasViewed: boolean;
}

interface StoryGroup {
  author: {
    _id: string;
    username: string;
    profileImage?: string;
    fullName: string;
  } | null;
  stories: Story[];
  hasUnviewed: boolean;
}

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  currentGroupIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PHOTO_DURATION = 10000; // 10 seconds for photos
const MAX_VIDEO_DURATION = 60000; // 60 seconds max for videos

export function StoryViewer({
  storyGroups,
  currentGroupIndex,
  onClose,
  onNext,
  onPrevious,
}: StoryViewerProps) {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const markViewed = useMutation(api.stories.markViewed);
  const deleteStory = useMutation(api.stories.remove);
  const toggleLike = useMutation(api.stories.toggleLike);

  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [shouldAdvance, setShouldAdvance] = useState(false);
  const [storyDuration, setStoryDuration] = useState(PHOTO_DURATION);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentStory?.authorId === user?.id;

  const isLiked = useQuery(
    api.stories.isLiked,
    clerkId && currentStory ? { clerkId, storyId: currentStory._id } : "skip"
  );

  const handleMarkViewed = useCallback(
    async (storyId: Id<"stories">) => {
      if (!currentStory?.hasViewed && clerkId) {
        await markViewed({ clerkId, storyId });
      }
    },
    [clerkId, markViewed, currentStory?.hasViewed]
  );

  // Reset state when story changes
  useEffect(() => {
    setCurrentStoryIndex(0);
    setProgress(0);
    setShowViewers(false);
    setStoryDuration(PHOTO_DURATION);
  }, [currentGroupIndex]);

  // Handle story advancement when progress completes
  useEffect(() => {
    if (!shouldAdvance) return;
    setShouldAdvance(false);
    setProgress(0);
    setStoryDuration(PHOTO_DURATION);
    
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      onNext();
    }
  }, [shouldAdvance, currentStoryIndex, currentGroup, onNext]);

  // Handle story progression
  useEffect(() => {
    if (!currentStory || isPaused || showViewers) return;

    // Mark as viewed when story loads
    handleMarkViewed(currentStory._id);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setShouldAdvance(true);
          return 0;
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    currentStory,
    currentStoryIndex,
    currentGroup,
    isPaused,
    showViewers,
    onNext,
    handleMarkViewed,
    storyDuration,
  ]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const handleClickLeft = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      onPrevious();
    }
  };

  const handleClickRight = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onNext();
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !clerkId) return;
    await deleteStory({ storyId: currentStory._id as Id<"stories">, clerkId });
    onNext();
  };

  const handleLike = async () => {
    if (!currentStory || !clerkId) return;
    await toggleLike({ clerkId, storyId: currentStory._id });
  };

  if (!currentStory) return null;

  const timeLeft = Math.max(
    0,
    Math.floor((currentStory.expiresAt - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {currentGroup.stories.map((story, index) => (
          <div key={story._id} className="flex-1 h-1 bg-white/30 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width:
                  index < currentStoryIndex
                    ? "100%"
                    : index === currentStoryIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 ring-2 ring-white/50">
            <AvatarImage src={currentGroup.author?.profileImage} />
            <AvatarFallback className="text-xs bg-white/20 text-white">
              {currentGroup.author?.fullName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">
              {currentGroup.author?.username}
            </span>
            <div className="flex items-center gap-2 text-white/70 text-xs">
              {currentStory.privacy === "everyone" ? (
                <Globe className="w-3 h-3" />
              ) : (
                <Users className="w-3 h-3" />
              )}
              <span>{timeLeft}h left</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/20"
            onClick={handleLike}
          >
            <Heart
              className={`w-5 h-5 mr-1 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
            />
            {currentStory.likesCount ?? 0}
          </Button>

          {isOwnStory && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/20"
              onClick={() => setShowViewers(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              {currentStory.viewsCount}
            </Button>
          )}

          {isOwnStory && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDeleteStory}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Story
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Story Content */}
      <div
        className="relative w-full h-full max-w-md mx-auto"
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Areas */}
        <div className="absolute inset-0 flex z-0">
          <div className="w-1/3" onClick={handleClickLeft} />
          <div className="w-1/3" />
          <div className="w-1/3" onClick={handleClickRight} />
        </div>

        {/* Media */}
        {currentStory.mediaType === "video" ? (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              const duration = Math.min(video.duration * 1000, MAX_VIDEO_DURATION);
              setStoryDuration(duration);
            }}
            onEnded={() => setShouldAdvance(true)}
          />
        ) : (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="w-full h-full object-contain"
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4 z-10">
            <p className="text-white text-center bg-black/50 rounded-lg p-3 backdrop-blur-sm">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Navigation Arrows (Desktop) */}
        <button
          onClick={handleClickLeft}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleClickRight}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Viewers Modal */}
      {showViewers && isOwnStory && (
        <div className="absolute inset-x-0 bottom-0 top-auto z-20 bg-background rounded-t-2xl max-h-[70%] overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Story Views</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowViewers(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-y-auto p-4">
            <StoryViewers storyId={currentStory._id as Id<"stories">} />
          </div>
        </div>
      )}
    </div>
  );
}

function StoryViewers({ storyId }: { storyId: Id<"stories"> }) {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const viewers = useQuery(
    api.stories.getStoryViewers,
    clerkId ? { clerkId, storyId: storyId as Id<"stories"> } : "skip"
  );

  if (!viewers) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  if (viewers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No views yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewers.map((view) => (
        <div key={view._id} className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={view.viewer?.profileImage} />
            <AvatarFallback>
              {view.viewer?.fullName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{view.viewer?.username}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(view.viewedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
