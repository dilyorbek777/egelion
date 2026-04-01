"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle, Trash2, Pencil, ImageIcon, VideoIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    author?: { username: string; profileImage?: string; fullName: string } | null;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useUser();
  const clerkId = user?.id ?? "";

  const isLiked = useQuery(
    api.interactions.isLiked,
    clerkId ? { clerkId, postId: post._id } : "skip"
  );
  const isSaved = useQuery(
    api.interactions.isSaved,
    clerkId ? { clerkId, postId: post._id } : "skip"
  );
  const comments = useQuery(api.interactions.getComments, { postId: post._id });
  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const toggleLike = useMutation(api.interactions.toggleLike);
  const toggleSave = useMutation(api.interactions.toggleSave);
  const addComment = useMutation(api.interactions.addComment);
  const removePost = useMutation(api.posts.remove);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [editMediaFile, setEditMediaFile] = useState<File | null>(null);
  const [editMediaPreview, setEditMediaPreview] = useState<string | null>(post.mediaUrl ?? null);
  const [editMediaType, setEditMediaType] = useState<"image" | "video" | null>(post.mediaType ?? null);
  const [editLoading, setEditLoading] = useState(false);
  const [editUploadError, setEditUploadError] = useState<string | null>(null);

  const updatePost = useMutation(api.posts.update);
  const { startUpload, isUploading } = useUploadThing("postMedia", {
    onClientUploadComplete: () => setEditUploadError(null),
    onUploadError: (err) => {
      setEditUploadError(err.message || "Upload failed");
      console.error("Upload error:", err);
    },
  });
  const isOwner = dbUser?._id === undefined
    ? false
    : post.author?.username === dbUser?.username;

  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticSaves, setOptimisticSaves] = useState<number | null>(null);
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);

  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const handleLike = async () => {
    if (!clerkId) return;

    const currentlyLiked = optimisticLiked ?? isLiked ?? false;
    const currentLikes = optimisticLikes ?? post.likesCount;

    setOptimisticLiked(!currentlyLiked);
    setOptimisticLikes(currentlyLiked ? currentLikes - 1 : currentLikes + 1);

    try {
      await toggleLike({ clerkId, postId: post._id });
    } catch (error) {
      setOptimisticLiked(currentlyLiked);
      setOptimisticLikes(currentLikes);
    }
  };

  const handleSave = async () => {
    if (!clerkId) return;

    const currentlySaved = optimisticSaved ?? isSaved ?? false;
    const currentSaves = optimisticSaves ?? post.savesCount;

    setOptimisticSaved(!currentlySaved);
    setOptimisticSaves(currentlySaved ? currentSaves - 1 : currentSaves + 1);

    try {
      await toggleSave({ clerkId, postId: post._id });
    } catch (error) {
      setOptimisticSaved(currentlySaved);
      setOptimisticSaves(currentSaves);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const [optimisticComments, setOptimisticComments] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const router = useRouter();

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("textarea")
    ) {
      return;
    }
    router.push(`/post/${post._id}`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clerkId) return;
    await removePost({ postId: post._id, clerkId });
    setDeleteDialogOpen(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !clerkId || !dbUser) return;

    const tempComment = {
      _id: `temp-${Date.now()}` as any,
      content: commentText,
      author: {
        username: dbUser.username,
        fullName: dbUser.fullName,
      },
      _creationTime: Date.now(),
    };

    setOptimisticComments(prev => [...prev, tempComment]);
    setCommentText("");

    try {
      await addComment({ clerkId, postId: post._id, content: commentText });
      setOptimisticComments([]);
    } catch (error) {
      setOptimisticComments([]);
    }
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
        mediaUrl = res[0]?.url;
        if (!mediaUrl) throw new Error("Upload failed - no URL");
      }
      await updatePost({ postId: post._id, clerkId, content: editContent, mediaUrl: mediaUrl ?? undefined, mediaType: mediaType ?? undefined });
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

  const handleDoubleClick = () => {
    const currentlyLiked = optimisticLiked ?? isLiked ?? false;
    if (currentlyLiked) return;

    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 800);
    handleLike();
  };

  const handleRemoveEditMedia = () => {
    setEditMediaFile(null);
    setEditMediaPreview(null);
    setEditMediaType(null);
    setEditUploadError(null);
  };

  return (
    <div
      className="border rounded-xl p-4 space-y-3 bg-background relative overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
      onDoubleClick={handleDoubleClick}
      onClick={handlePostClick}
    >
      {/* Double-tap like animation */}
      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <Heart className="w-32 h-32 text-red-500 fill-red-500 animate-ping" />
        </div>
      )}
      {/* Author */}
      <div className="flex items-center justify-between">
        <Link href={`/profile/${post.author?.username}`} className="flex items-center gap-2">
          {post.author?.profileImage ? (
            <img
              src={post.author.profileImage}
              alt={post.author.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
              {post.author?.fullName?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{post.author?.fullName}</p>
            <p className="text-xs text-muted-foreground">@{post.author?.username}</p>
          </div>
        </Link>
        {isOwner && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && <p className="text-sm">{post.content}</p>}

      {/* Media */}
      {post.mediaUrl && (
        <div className="cursor-default" onClick={(e) => e.stopPropagation()}>
          {post.mediaType === "video" ? (
            <VideoPlayer src={post.mediaUrl} postId={post._id} />
          ) : (
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full rounded-lg object-cover max-h-96"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1 text-sm transition-colors",
            (optimisticLiked ?? isLiked) ? "text-red-500" : "text-muted-foreground hover:text-red-400"
          )}
        >
          <Heart className={cn("w-4 h-4", (optimisticLiked ?? isLiked) && "fill-current")} />
          {optimisticLikes ?? post.likesCount}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {post.commentsCount}
        </button>

        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1 text-sm transition-colors",
            (optimisticSaved ?? isSaved) ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-400"
          )}
        >
          <Bookmark className={cn("w-4 h-4", (optimisticSaved ?? isSaved) && "fill-current")} />
          {optimisticSaves ?? post.savesCount}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-3 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
          {[...(optimisticComments || []), ...(comments || [])]
            .sort((a, b) => (a._creationTime || 0) - (b._creationTime || 0))
            .map((c) => (
              <div key={c._id} className="flex gap-2 text-sm">
                <span className="font-medium">@{c.author?.username}</span>
                <span className="text-muted-foreground">{c.content}</span>
              </div>
            ))}
          {clerkId && (
            <form onSubmit={handleComment} className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="h-8 text-sm"
              />
              <Button type="submit" size="sm" variant="secondary">Post</Button>
            </form>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="What's on your mind?"
              className="resize-none"
              rows={3}
            />
            {editUploadError && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {editUploadError}
              </div>
            )}
            {editMediaPreview && (
              <div className="relative">
                {editMediaType === "video" ? (
                  <video src={editMediaPreview} className="w-full rounded-lg max-h-64" />
                ) : (
                  <img src={editMediaPreview} alt="" className="w-full rounded-lg object-cover max-h-64" />
                )}
                <button
                  type="button"
                  onClick={handleRemoveEditMedia}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <label htmlFor={`edit-image-${post._id}`} className={`cursor-pointer transition-colors ${editMediaType === "image" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <ImageIcon className="w-5 h-5" />
                  <input id={`edit-image-${post._id}`} type="file" accept="image/*" className="hidden" onChange={handleEditFileChange} />
                </label>
                <label htmlFor={`edit-video-${post._id}`} className={`cursor-pointer transition-colors ${editMediaType === "video" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <VideoIcon className="w-5 h-5" />
                  <input id={`edit-video-${post._id}`} type="file" accept="video/*" className="hidden" onChange={handleEditFileChange} />
                </label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
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
    </div>
  );
}
