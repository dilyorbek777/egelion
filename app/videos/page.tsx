"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, X, Send, Play, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface VideoPost {
  _id: Id<"posts">;
  authorId: Id<"users">;
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  author?: {
    _id: Id<"users">;
    username: string;
    fullName: string;
    profileImage?: string;
  } | null;
}

interface Comment {
  _id: Id<"comments">;
  postId: Id<"posts">;
  authorId: Id<"users">;
  content: string;
  _creationTime: number;
  author?: {
    _id: Id<"users">;
    username: string;
    fullName: string;
    profileImage?: string;
  } | null;
}

function VideoItem({
  post,
  isActive,
  onOpenComments,
}: {
  post: VideoPost;
  isActive: boolean;
  onOpenComments: (postId: Id<"posts">) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount);
  const [localSavesCount, setLocalSavesCount] = useState(post.savesCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);
  const { user } = useUser();
  const clerkId = user?.id ?? "";

  const toggleLikeMutation = useMutation(api.interactions.toggleLike);
  const toggleSaveMutation = useMutation(api.interactions.toggleSave);
  const toggleFollowMutation = useMutation(api.interactions.toggleFollow);
  const currentUserQuery = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const isLikedQuery = useQuery(
    api.interactions.isLiked,
    clerkId && post._id ? { clerkId, postId: post._id } : "skip"
  );
  const isSavedQuery = useQuery(
    api.interactions.isSaved,
    clerkId && post._id ? { clerkId, postId: post._id } : "skip"
  );
  const isFollowingQuery = useQuery(
    api.interactions.isFollowing,
    clerkId && post.authorId ? { clerkId, targetUserId: post.authorId } : "skip"
  );
  const isOwnVideo = currentUserQuery?._id === post.authorId;

  useEffect(() => {
    if (isFollowingQuery !== undefined) setIsFollowing(isFollowingQuery);
  }, [isFollowingQuery]);

  useEffect(() => {
    if (isLikedQuery !== undefined) setLiked(isLikedQuery);
  }, [isLikedQuery]);

  useEffect(() => {
    if (isSavedQuery !== undefined) setSaved(isSavedQuery);
  }, [isSavedQuery]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayIndicator(true);
    setTimeout(() => setShowPlayIndicator(false), 800);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setHeartPosition({ x, y });
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 800);
      
      if (!liked) {
        handleLike();
      }
    } else {
      // Single tap - toggle play
      togglePlay();
    }
    lastTapRef.current = now;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLike = async () => {
    if (!clerkId || !post._id) return;

    try {
      const result = await toggleLikeMutation({ clerkId, postId: post._id });
      setLiked(result);
      setLocalLikesCount((prev) => (result ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!clerkId || !post._id) return;

    try {
      const result = await toggleSaveMutation({ clerkId, postId: post._id });
      setSaved(result);
      setLocalSavesCount((prev) => (result ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleFollow = async () => {
    if (!clerkId || !post.authorId) return;

    try {
      const result = await toggleFollowMutation({ clerkId, targetUserId: post.authorId });
      setIsFollowing(result);
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    const shareData = {
      title: `Video by @${post.author?.username}`,
      text: post.content || `Check out this video by @${post.author?.username} on Egelion!`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // Could add a toast notification here
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
        // Fallback: try clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert("Link copied to clipboard!");
        } catch {
          console.error("Failed to copy to clipboard");
        }
      }
    }
  };

  return (
    <div className="relative h-full w-full snap-start snap-always md:flex md:items-center md:justify-center ">
      {/* Video Container - constrained on large screens */}
      <div className="absolute top-0 inset-0 md:static md:h-full md:w-auto md:aspect-9/16 md:max-h-screen md:mx-auto" onClick={handleVideoClick}>
        {post.mediaUrl && (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            className="h-full w-full bg-accent dark:bg-background md:w-auto md:object-contain"
            loop
            playsInline
            muted={isMuted}
            preload="metadata"
            onLoadedData={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
          />
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-white/30 border-t-white" />
          </div>
        )}

        {/* Play/Pause Indicator */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300",
            showPlayIndicator ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="rounded-full bg-black/40 p-4 backdrop-blur-sm">
            {isPlaying ? (
              <div className="flex gap-1">
                <div className="w-1.5 h-6 bg-white rounded-sm" />
                <div className="w-1.5 h-6 bg-white rounded-sm" />
              </div>
            ) : (
              <Play className="h-8 w-8 text-white fill-white ml-1" />
            )}
          </div>
        </div>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-30 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 active:scale-95"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>

        {/* Double-tap Heart Animation */}
        {showDoubleTapHeart && (
          <div
            className="absolute z-40 pointer-events-none animate-ping"
            style={{
              left: heartPosition.x - 50,
              top: heartPosition.y - 50,
            }}
          >
            <Heart className="h-24 w-24 fill-red-500 text-red-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Overlay Content */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Right Side Actions */}
        <div className="absolute right-3 bottom-24 md:bottom-8 flex flex-col items-center gap-5 pointer-events-auto">
          {/* Like Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleLike}
              className="group relative rounded-full bg-black/20 p-3 transition-all hover:bg-black/40 hover:scale-110 active:scale-95"
            >
              <Heart
                className={cn(
                  "h-7 w-7 transition-all duration-300",
                  liked ? "fill-red-500 text-red-500 scale-110" : "text-black dark:text-white"
                )}
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                {liked && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </>
                )}
              </span>
            </button>
            <span className="text-xs font-semibold text-black dark:text-white drop-shadow-md">
              {localLikesCount > 0 ? localLikesCount : "Like"}
            </span>
          </div>

          {/* Comments Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onOpenComments(post._id)}
              className="group rounded-full bg-black/20 p-3 transition-all hover:bg-black/40 hover:scale-110 active:scale-95"
            >
              <MessageCircle className="h-7 w-7 text-black dark:text-white" />
            </button>
            <span className="text-xs font-semibold text-black dark:text-white drop-shadow-md">
              {post.commentsCount > 0 ? post.commentsCount : "Comment"}
            </span>
          </div>

          {/* Save Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleSave}
              className="group relative rounded-full bg-black/20 p-3 transition-all hover:bg-black/40 hover:scale-110 active:scale-95"
            >
              <Bookmark
                className={cn(
                  "h-7 w-7 transition-all duration-300",
                  saved ? "fill-yellow-400 text-yellow-400 scale-110" : "text-black dark:text-white"
                )}
              />
            </button>
            <span className="text-xs font-semibold text-black dark:text-white drop-shadow-md">
              {localSavesCount > 0 ? localSavesCount : "Save"}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center gap-1 z-20">
            <button
              onClick={handleShare}
              className="group rounded-full bg-black/20 p-3 transition-all hover:bg-black/40 hover:scale-110 active:scale-95"
            >
              <Share2 className="h-7 w-7 text-black dark:text-white" />
            </button>
            <span className="text-xs font-semibold text-black dark:text-white drop-shadow-md">Share</span>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute mx-auto bottom-20 md:bottom-4 left-0 right-0 p-4 bg-gradient-to-t from-primary/30 via-primary/10 to-transparent pointer-events-auto">
          <div className="flex items-center justify-start w-fit gap-3 mb-3">
            <Link href={`/profile/${post.author?.username}`}>
              <Avatar className="h-11 w-11 border-2 border-white/80 shadow-lg transition-transform hover:scale-105">
                <AvatarImage src={post.author?.profileImage ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                  {post.author?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col">
              <Link
                href={`/profile/${post.author?.username}`}
                className="font-bold text-black dark:text-white hover:underline drop-shadow-md"
              >
                @{post.author?.username}
              </Link>
              <span className="text-xs text-black/80 dark:text-white/80">{post.author?.fullName}</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFollow}
              className={cn(
                "ml-auto bg-primary text-white border-0 hover:bg-white/30 backdrop-blur-sm text-xs font-semibold px-4",
                !post.author?._id || isOwnVideo ? "hidden" : ""
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          {post.content && (
            <p className="text-black dark:text-white text-sm mb-3 line-clamp-3 max-w-[80%] drop-shadow-md leading-relaxed">
              {post.content}
            </p>
          )}

          {/* Music/Sound indicator */}
          <div className="flex items-center gap-2 text-black/90 dark:text-white/90 text-xs">
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5 items-end h-3">
                <div className="w-0.5 bg-black dark:bg-white animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
                <div className="w-0.5 bg-black dark:bg-white animate-pulse" style={{ height: "100%", animationDelay: "150ms" }} />
                <div className="w-0.5 bg-black dark:bg-white animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
                <div className="w-0.5 bg-black dark:bg-white animate-pulse" style={{ height: "80%", animationDelay: "450ms" }} />
              </div>
              <span className="font-medium drop-shadow">Original Sound</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentsSheet({
  postId,
  isOpen,
  onClose,
}: {
  postId: Id<"posts"> | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [newComment, setNewComment] = useState("");
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  const comments = useQuery(
    api.interactions.getComments,
    postId ? { postId } : "skip"
  );
  const addComment = useMutation(api.interactions.addComment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !clerkId || !postId) return;

    try {
      await addComment({ clerkId, postId, content: newComment.trim() });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!isOpen || !postId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60  transition-opacity z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-18 md:bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Comments</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div
          ref={commentsContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]"
        >
          {!comments ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment: Comment) => (
              <div key={comment._id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.author?.profileImage ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {comment.author?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${comment.author?.username}`}
                      className="font-semibold text-sm hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      @{comment.author?.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment._creationTime).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1 break-words">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}

export default function VideosPage() {
  const videos = useQuery(api.posts.getVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCommentPostId, setActiveCommentPostId] = useState<Id<"posts"> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const children = container.children;
    if (children[index]) {
      children[index].scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentIndex(index);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!videos) return;
      
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, videos.length - 1);
        scrollToIndex(nextIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        scrollToIndex(prevIndex);
      } else if (e.key === " " && !e.repeat) {
        // Only prevent space from scrolling when not in an input
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, videos.length - 1);
        scrollToIndex(nextIndex);
      }
    },
    [currentIndex, videos, scrollToIndex]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleScroll, handleKeyDown]);

  if (!videos) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-xl font-semibold">No videos yet</p>
        <p className="text-muted-foreground">Be the first to upload a video!</p>
        <Link href="/create-post">
          <Button>Create Post</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black md:static md:bg-background">
      {/* Mobile: Fullscreen scroll container */}
      <div
        ref={containerRef}
        className="h-[calc(100vh-4rem)] md:h-[calc(100vh-0.5rem)] w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        {videos.map((post, index) => (
          <VideoItem
            key={post._id}
            post={post}
            isActive={index === currentIndex}
            onOpenComments={setActiveCommentPostId}
          />
        ))}
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        postId={activeCommentPostId}
        isOpen={!!activeCommentPostId}
        onClose={() => setActiveCommentPostId(null)}
      />

      {/* Scroll indicators for desktop */}
      <div className="fixed right-24 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 z-50">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-0 shadow-lg transition-all hover:scale-110 disabled:opacity-30"
          onClick={() => scrollToIndex(Math.max(currentIndex - 1, 0))}
          disabled={currentIndex === 0}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <span className="text-xs font-medium text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {videos.length}
          </span>
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-0 shadow-lg transition-all hover:scale-110 disabled:opacity-30"
          onClick={() =>
            scrollToIndex(Math.min(currentIndex + 1, videos.length - 1))
          }
          disabled={currentIndex === videos.length - 1}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      
    </div>
  );
}
