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
  Pause,
  Play,
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
    profileImage?: string | null;
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

const PHOTO_DURATION = 10000;
const MAX_VIDEO_DURATION = 60000;

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
  const [storyDuration, setStoryDuration] = useState(PHOTO_DURATION);
  const [showPauseIndicator, setShowPauseIndicator] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentStory?.authorId === user?.id;

  const currentStoryIndexRef = useRef(currentStoryIndex);
  const currentGroupRef = useRef(currentGroup);

  useEffect(() => {
    currentStoryIndexRef.current = currentStoryIndex;
  }, [currentStoryIndex]);

  useEffect(() => {
    currentGroupRef.current = currentGroup;
  }, [currentGroup]);

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

  const advanceStory = useCallback(() => {
    setProgress(0);
    setStoryDuration(PHOTO_DURATION);

    const idx = currentStoryIndexRef.current;
    const group = currentGroupRef.current;

    if (idx < group.stories.length - 1) {
      setCurrentStoryIndex(idx + 1);
    } else {
      onNext();
    }
  }, [onNext]);

  useEffect(() => {
    setCurrentStoryIndex(0);
    setProgress(0);
    setShowViewers(false);
    setStoryDuration(PHOTO_DURATION);
  }, [currentGroupIndex]);

  useEffect(() => {
    if (!currentStory || isPaused || showViewers) return;

    handleMarkViewed(currentStory._id);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          advanceStory();
          return 0;
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    currentStory,
    isPaused,
    showViewers,
    handleMarkViewed,
    storyDuration,
    advanceStory,
  ]);

  const handleTouchStart = () => {
    setIsPaused(true);
    setShowPauseIndicator(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    pauseTimeoutRef.current = setTimeout(() => setShowPauseIndicator(false), 500);
  };

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
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Progress Bars */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
        {currentGroup.stories.map((story, index) => (
          <div key={story._id} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-white rounded-full",
                index === currentStoryIndex && !isPaused && "transition-all duration-100 ease-linear"
              )}
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
      <div className="absolute top-6 left-2 right-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Avatar className="w-9 h-9 ring-2 ring-white/30">
              <AvatarImage src={currentGroup.author?.profileImage ?? undefined} />
              <AvatarFallback className="text-xs bg-linear-to-br from-primary/80 to-primary text-white font-medium">
                {currentGroup.author?.fullName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwnStory && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full ring-2 ring-black" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm leading-tight">
              {currentGroup.author?.username}
            </span>
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              {currentStory.privacy === "everyone" ? (
                <Globe className="w-3 h-3" />
              ) : (
                <Users className="w-3 h-3" />
              )}
              <span>{timeLeft}h left</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isOwnStory && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-2 rounded-full"
                onClick={() => setShowViewers(true)}
              >
                <Eye className="w-4 h-4 mr-1" />
                <span className="text-sm">{currentStory.viewsCount}</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={handleDeleteStory}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Story
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Pause Indicator */}
      {showPauseIndicator && isPaused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Pause className="w-7 h-7 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Story Content */}
      <div
        className="relative w-full h-full max-w-lg mx-auto"
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Zones */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 h-full" onClick={handleClickLeft} />
          <div className="w-1/3 h-full" onMouseDown={(e) => e.stopPropagation()} />
          <div className="w-1/3 h-full" onClick={handleClickRight} />
        </div>

        {/* Media Container */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          {currentStory.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain max-h-screen"
              autoPlay
              
              playsInline
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                const duration = Math.min(video.duration * 1000, MAX_VIDEO_DURATION);
                setStoryDuration(duration);
              }}
              onEnded={advanceStory}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain max-h-screen"
            />
          )}
        </div>

        {/* Caption */}

        <div className="absolute bottom-24 left-4 right-4 z-20">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3">
            {currentStory.caption && (
              <p className="text-white text-center text-sm leading-relaxed">
                {currentStory.caption}
              </p>
            )}

            <div className="">
              <div className="flex items-center justify-between">
                {/* Like Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-10 px-4 rounded-full backdrop-blur-md transition-all duration-200",
                    isLiked
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                >
                  <Heart
                    className={cn(
                      "w-5 h-5 mr-2 transition-all duration-200",
                      isLiked && "fill-red-500 scale-110"
                    )}
                  />
                  <span className="font-medium">{currentStory.likesCount ?? 0}</span>
                </Button>

                {/* Story Counter */}
                <div className="text-white/60 text-xs font-medium">
                  {currentStoryIndex + 1} / {currentGroup.stories.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}


        {/* Navigation Arrows (Desktop) */}
        <button
          onClick={handleClickLeft}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all z-20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleClickRight}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all z-20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Viewers Sheet */}
      {showViewers && isOwnStory && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-background rounded-t-3xl max-h-[75%] overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Story Views</h3>
              <span className="text-sm text-muted-foreground">
                ({currentStory.viewsCount})
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowViewers(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-y-auto p-2">
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (viewers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Eye className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-medium">No views yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Your story hasn't been viewed by anyone
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {viewers.map((view) => (
        <div
          key={view._id}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <Avatar className="w-11 h-11">
            <AvatarImage src={view.viewer?.profileImage ?? undefined} />
            <AvatarFallback className="bg-linear-to-br from-primary/80 to-primary text-white text-sm font-medium">
              {view.viewer?.fullName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{view.viewer?.username}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(view.viewedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
