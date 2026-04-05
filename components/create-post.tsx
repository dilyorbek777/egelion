"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, VideoIcon, X, Loader2, Send, Sparkles } from "lucide-react";
import { UPLOAD_LIMITS } from "@/constants";
import { CreateStory } from "./create-story";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert MB to bytes for validation
const MB = 1024 * 1024;
const MAX_IMAGE_SIZE = 8 * MB;
const MAX_VIDEO_SIZE = 64 * MB;

export function CreatePost() {
  const user = useCurrentUser();
  const router = useRouter();
  const createPost = useMutation(api.posts.create);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const { startUpload, isUploading } = useUploadThing("postMedia", {
    onClientUploadComplete: () => {
      setUploadError(null);
      setUploadComplete(true);
    },
    onUploadError: (err) => {
      setUploadError(err.message || "Upload failed - server error");
      console.error("Upload error:", err);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
      setUploadComplete(false);
    },
  });

  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    const isVideo = file.type.startsWith("video");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    const limitLabel = isVideo ? UPLOAD_LIMITS.video : UPLOAD_LIMITS.image;

    if (file.size > maxSize) {
      setUploadError(`File too large. Maximum size for ${isVideo ? "videos" : "images"} is ${limitLabel}.`);
      return;
    }

    setUploadError(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(isVideo ? "video" : "image");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!content.trim() && !mediaFile)) return;

    setLoading(true);
    setUploadError(null);
    try {
      let mediaUrl: string | undefined;
      if (mediaFile) {
        console.log("Starting upload for file:", mediaFile.name, mediaFile.type);
        const res = await startUpload([mediaFile]);
        console.log("Upload response:", res);
        
        if (!res || res.length === 0) {
          throw new Error("Upload failed - no response from server");
        }
        
        mediaUrl = res[0]?.ufsUrl;
        if (!mediaUrl) {
          throw new Error("Upload failed - no URL in response");
        }
        
        console.log("Upload successful, URL:", mediaUrl);
      }

      await createPost({
        clerkId: user.clerkId,
        content: content.trim() || undefined,
        mediaUrl,
        mediaType: mediaType ?? undefined,
      });

      setContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      setUploadProgress(0);
      setUploadComplete(false);
      
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadComplete(false);
  };

  const userInitials = user?.fullName?.[0] || "U";

  return (
    <form onSubmit={handleSubmit} className="bg-background border rounded-2xl overflow-hidden shadow-xl/50 ">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card/50">
        <Avatar size="sm">
          <AvatarImage src={user?.profileImage || undefined} alt={user?.bio || ""} />
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {user?.fullName || "User"}
          </p>
          <p className="text-xs text-muted-foreground">What's on your mind?</p>
        </div>
        <button
          type="button"
          onClick={() => setIsStoryModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Story
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          className="resize-none min-h-[100px] p-5 border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
          rows={3}
        />

        {/* Error Message */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-destructive/10 border border-destructive/20 p-3"
            >
              <p className="text-sm text-destructive flex items-center gap-2">
                <X className="w-4 h-4" />
                {uploadError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Preview */}
        <AnimatePresence mode="wait">
          {mediaPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-xl overflow-hidden bg-muted"
            >
              {mediaType === "video" ? (
                <video
                  src={mediaPreview}
                  className="w-full max-h-[300px] object-cover"
                  controls
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-[300px] object-cover"
                />
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Upload Progress Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              )}

              {/* Upload Complete Indicator */}
              {uploadComplete && !isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
                >
                  <div className="flex items-center gap-2 text-white text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium">Ready to post</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center gap-1">
          <label
            htmlFor="post-image"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
              mediaType === "image"
                ? "bg-green-500/10 text-green-600"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Photo</span>
            <input
              id="post-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <label
            htmlFor="post-video"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
              mediaType === "video"
                ? "bg-purple-500/10 text-purple-600"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <VideoIcon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Video</span>
            <input
              id="post-video"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <span className="text-xs text-muted-foreground ml-2 hidden md:inline">
            {UPLOAD_LIMITS.image} · {UPLOAD_LIMITS.video}
          </span>
        </div>

        <Button
          type="submit"
          disabled={loading || isUploading || (!content.trim() && !mediaFile)}
          className="gap-2 rounded-xl px-5"
        >
          {loading || isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Post
            </>
          )}
        </Button>
      </div>

      {/* Story Modal */}
      <CreateStory isOpen={isStoryModalOpen} onClose={() => setIsStoryModalOpen(false)} />
    </form>
  );
}
