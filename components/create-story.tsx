"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, ImageIcon, Film, Globe, Users, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CreateStoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateStory({ isOpen, onClose }: CreateStoryProps) {
  const { user } = useUser();
  const createStory = useMutation(api.stories.create);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);

  const { startUpload, isUploading } = useUploadThing("postMedia", {
    onClientUploadComplete: () => {
      setUploadError(null);
      setUploadComplete(true);
    },
    onUploadError: (err) => {
      setUploadError(err.message || "Upload failed");
      console.error("Upload error:", err);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
      setUploadComplete(false);
    },
  });

  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [privacy, setPrivacy] = useState<"everyone" | "followers">("followers");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      handleFileChange(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mediaFile || !mediaType) return;

    setLoading(true);
    setUploadError(null);
    try {
      const res = await startUpload([mediaFile]);
      if (!res || res.length === 0) {
        throw new Error("Upload failed");
      }
      const mediaUrl = res[0]?.ufsUrl;
      if (!mediaUrl) {
        throw new Error("Upload failed");
      }

      await createStory({
        clerkId: user.id,
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
        privacy,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating story:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCaption("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);
    setPrivacy("followers");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadComplete(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold">Create Story</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Media Upload Area */}
          <AnimatePresence mode="wait">
            {!mediaPreview ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "relative rounded-2xl border-2 border-dashed transition-all duration-200",
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="p-8 text-center">

                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop your photo or video here
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <div className="flex justify-center gap-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleInputChange}
                      />
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-full transition-colors">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Photo
                      </span>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleInputChange}
                      />
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-full transition-colors">
                        <Film className="w-3.5 h-3.5" />
                        Video
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-2xl overflow-hidden bg-muted"
              >
                {mediaType === "video" ? (
                  <video
                    src={mediaPreview}
                    className="w-full aspect-[9/16] max-h-[320px] object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full aspect-square max-h-[320px] object-cover"
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
                      <span className="font-medium">Ready to share</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3"
              >
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {uploadError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Caption */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Caption</label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="resize-none min-h-[80px] rounded-xl border-muted-foreground/20 focus:border-primary focus:ring-primary/20"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Who can see this?</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setPrivacy("everyone")}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  privacy === "everyone"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="w-4 h-4" />
                Everyone
              </button>
              <button
                type="button"
                onClick={() => setPrivacy("followers")}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  privacy === "followers"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="w-4 h-4" />
                Followers
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl h-11"
              onClick={handleClose}
              disabled={loading || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isUploading || !mediaFile}
              className={cn(
                "flex-1 rounded-xl h-11 font-medium",
                !mediaFile && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                "Share Story"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
