"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Trash2,
  Pencil,
  ImageIcon,
  VideoIcon,
  X,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "./video-player";

interface PostCardProps {
  post: {
    _id: Id<"posts">;
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    likesCount: number;
    commentsCount: number;
    savesCount: number;
    hashtags?: string[];
    authorId: Id<"users">;
    author?: { username: string; profileImage?: string | null; fullName: string } | null;
  };
}

function HashtagText({ content, onHashtagClick }: { content: string; onHashtagClick?: (tag: string) => void }) {
  const parts = content.split(/(#\w+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("#")) {
          const tag = part.slice(1);
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onHashtagClick?.(tag);
              }}
              className="text-primary font-medium hover:underline decoration-2 underline-offset-2 transition-colors"
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const router = useRouter();

  const isLiked = useQuery(
    api.interactions.isLiked,
    clerkId ? { clerkId, postId: post._id } : "skip"
  );
  const isSaved = useQuery(
    api.interactions.isSaved,
    clerkId ? { clerkId, postId: post._id } : "skip"
  );
  const comments = useQuery(api.interactions.getComments, { postId: post._id });
  const dbUser = useQuery(api.users.getByClerkId, clerkId ? { clerkId } : "skip");
  const hasStories = useQuery(
    api.stories.hasPublicActiveStories,
    post.author?.username ? { username: post.author.username } : "skip"
  );

  const toggleLike = useMutation(api.interactions.toggleLike);
  const toggleSave = useMutation(api.interactions.toggleSave);
  const addComment = useMutation(api.interactions.addComment);
  const removePost = useMutation(api.posts.remove);
  const updatePost = useMutation(api.posts.update);

  const { startUpload, isUploading } = useUploadThing("postMedia", {
    onClientUploadComplete: () => setEditUploadError(null),
    onUploadError: (err) => {
      setEditUploadError(err.message || "Upload failed");
      console.error("Upload error:", err);
    },
  });

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [editMediaFile, setEditMediaFile] = useState<File | null>(null);
  const [editMediaPreview, setEditMediaPreview] = useState<string | null>(post.mediaUrl ?? null);
  const [editMediaType, setEditMediaType] = useState<"image" | "video" | null>(post.mediaType ?? null);
  const [editLoading, setEditLoading] = useState(false);
  const [editUploadError, setEditUploadError] = useState<string | null>(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticSaves, setOptimisticSaves] = useState<number | null>(null);
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const [optimisticComments, setOptimisticComments] = useState<any[]>([]);

  const isOwner = dbUser?._id === undefined
    ? false
    : post.author?.username === dbUser?.username;

  const handleLike = async () => {
    if (!clerkId) return;
    const currentlyLiked = optimisticLiked ?? isLiked ?? false;
    const currentLikes = optimisticLikes ?? post.likesCount;
    setOptimisticLiked(!currentlyLiked);
    setOptimisticLikes(currentlyLiked ? currentLikes - 1 : currentLikes + 1);
    try {
      await toggleLike({ clerkId, postId: post._id });
    } catch {
      setOptimisticLiked(currentlyLiked);
      setOptimisticLikes(currentLikes);
    }
  };

  const handleDoubleClick = () => {
    const currentlyLiked = optimisticLiked ?? isLiked ?? false;
    if (currentlyLiked) return;
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 800);
    handleLike();
  };

  const handleSave = async () => {
    if (!clerkId) return;
    const currentlySaved = optimisticSaved ?? isSaved ?? false;
    const currentSaves = optimisticSaves ?? post.savesCount;
    setOptimisticSaved(!currentlySaved);
    setOptimisticSaves(currentlySaved ? currentSaves - 1 : currentSaves + 1);
    try {
      await toggleSave({ clerkId, postId: post._id });
    } catch {
      setOptimisticSaved(currentlySaved);
      setOptimisticSaves(currentSaves);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    const shareData = {
      title: `Post by @${post.author?.username}`,
      text: post.content || `Check out this post by @${post.author?.username} on Egelion!`,
      url: shareUrl,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          console.error("Failed to copy to clipboard");
        }
      }
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("[data-dropdown-menu]")
    ) {
      return;
    }
    router.push(`/post/${post._id}`);
  };

  const handleHashtagClick = (tag: string) => {
    router.push(`/hashtag/${tag}`);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !clerkId || !dbUser) return;
    const tempComment = {
      _id: `temp-${Date.now()}` as any,
      content: commentText,
      author: { username: dbUser.username, fullName: dbUser.fullName },
      _creationTime: Date.now(),
    };
    setOptimisticComments((prev) => [...prev, tempComment]);
    setCommentText("");
    try {
      await addComment({ clerkId, postId: post._id, content: commentText });
      setOptimisticComments([]);
    } catch {
      setOptimisticComments([]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clerkId) return;
    await removePost({ postId: post._id, clerkId });
    setDeleteDialogOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!clerkId) return;
    setEditLoading(true);
    setEditUploadError(null);
    try {
      let mediaUrl = editMediaPreview;
      let mediaType = editMediaType;
      if (editMediaFile) {
        const res = await startUpload([editMediaFile]);
        if (!res || res.length === 0) throw new Error("Upload failed");
        mediaUrl = res[0]?.ufsUrl;
        if (!mediaUrl) throw new Error("Upload failed - no URL");
      }
      await updatePost({
        postId: post._id,
        clerkId,
        content: editContent,
        mediaUrl: mediaUrl ?? undefined,
        mediaType: mediaType ?? undefined,
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating post:", error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditUploadError(null);
    setEditMediaFile(file);
    setEditMediaPreview(URL.createObjectURL(file));
    setEditMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handleRemoveEditMedia = () => {
    setEditMediaFile(null);
    setEditMediaPreview(null);
    setEditMediaType(null);
    setEditUploadError(null);
  };

  const displayLikes = optimisticLikes ?? post.likesCount;
  const displaySaves = optimisticSaves ?? post.savesCount;
  const liked = optimisticLiked ?? isLiked ?? false;
  const saved = optimisticSaved ?? isSaved ?? false;

  return (
    <article
      className="bg-background border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onDoubleClick={handleDoubleClick}
      onClick={handlePostClick}
    >
      {/* Double-tap like animation */}
      {showLikeAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-ping" />
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar with story ring */}
          <Link
            href={`/stories/${post.author?.username}`}
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full p-[2px] transition-transform duration-200 hover:scale-105",
                hasStories
                  ? "bg-gradient-to-tr from-primary via-cyan-500 to-primary"
                  : "bg-border"
              )}
            >
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                {post.author?.profileImage ? (
                  <img
                    src={post.author.profileImage}
                    alt={post.author.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {post.author?.fullName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
            </div>
           
          </Link>

          {/* Author info */}
          <div className="flex flex-col">
            <Link
              href={`/profile/${post.author?.username}`}
              className="font-semibold text-sm hover:underline decoration-1 underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {post.author?.fullName}
            </Link>
            <Link
              href={`/profile/${post.author?.username}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              @{post.author?.username}
            </Link>
          </div>
        </div>

        {/* Options menu */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-dropdown-menu>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3 ">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            <HashtagText content={post.content} onHashtagClick={handleHashtagClick} />
          </p>
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                handleHashtagClick(tag);
              }}
              className="text-xs text-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-full font-medium transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div className="relative bg-muted border border-border/50" onClick={(e) => e.stopPropagation()}>
          {post.mediaType === "video" ? (
            <VideoPlayer src={post.mediaUrl} postId={post._id} />
          ) : (
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full max-h-[600px] object-cover"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-200",
                liked
                  ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                  : "text-foreground hover:text-red-500 hover:bg-red-50"
              )}
              onClick={handleLike}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  liked && "fill-current scale-110"
                )}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-200",
                showComments
                  ? "text-primary hover:bg-primary/10"
                  : "text-foreground hover:text-primary hover:bg-primary/10"
              )}
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full transition-all duration-200",
              saved
                ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                : "text-foreground hover:text-yellow-500 hover:bg-yellow-50"
            )}
            onClick={handleSave}
          >
            <Bookmark
              className={cn(
                "w-5 h-5 transition-transform duration-200",
                saved && "fill-current"
              )}
            />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          {displayLikes > 0 && (
            <span className="font-semibold">{formatCount(displayLikes)} likes</span>
          )}
          {post.commentsCount > 0 && !showComments && (
            <button
              onClick={() => setShowComments(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              View {formatCount(post.commentsCount)} comments
            </button>
          )}
          {saved && displaySaves > 0 && (
            <span className="text-muted-foreground">{formatCount(displaySaves)} saves</span>
          )}
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {[...(optimisticComments || []), ...(comments || [])]
              .sort((a, b) => (a._creationTime || 0) - (b._creationTime || 0))
              .map((c) => (
                <div key={c._id} className="flex gap-2 text-sm">
                  <Link
                    href={`/profile/${c.author?.username}`}
                    className="font-semibold hover:underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.author?.username}
                  </Link>
                  <span className="text-foreground/80">{c.content}</span>
                </div>
              ))}
            {(!optimisticComments.length && !comments?.length) && (
              <p className="text-sm text-muted-foreground italic">No comments yet. Be the first!</p>
            )}
          </div>

          {clerkId && (
            <form onSubmit={handleComment} className="flex gap-2 pt-1">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={!commentText.trim()}
                className="h-9 w-9 shrink-0 text-primary hover:text-primary hover:bg-primary/10 disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="What's on your mind?"
              className="resize-none min-h-[100px]"
            />

            {editUploadError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {editUploadError}
              </div>
            )}

            {editMediaPreview && (
              <div className="relative rounded-xl overflow-hidden">
                {editMediaType === "video" ? (
                  <video src={editMediaPreview} className="w-full max-h-64 object-cover" />
                ) : (
                  <img
                    src={editMediaPreview}
                    alt=""
                    className="w-full max-h-64 object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemoveEditMedia}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <label
                  htmlFor={`edit-image-${post._id}`}
                  className={cn(
                    "cursor-pointer transition-colors p-2 rounded-lg hover:bg-muted",
                    editMediaType === "image" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <ImageIcon className="w-5 h-5" />
                  <input
                    id={`edit-image-${post._id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditFileChange}
                  />
                </label>
                <label
                  htmlFor={`edit-video-${post._id}`}
                  className={cn(
                    "cursor-pointer transition-colors p-2 rounded-lg hover:bg-muted",
                    editMediaType === "video" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <VideoIcon className="w-5 h-5" />
                  <input
                    id={`edit-video-${post._id}`}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleEditFileChange}
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={editLoading || isUploading || (!editContent.trim() && !editMediaPreview)}
                >
                  {editLoading || isUploading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
