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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ImageIcon, VideoIcon, Globe, Users, Check } from "lucide-react";

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
      setUploadError(err.message || "Upload failed - server error");
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
  const [privacy, setPrivacy] = useState<"everyone" | "followers">("everyone");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mediaFile || !mediaType) return;

    setLoading(true);
    setUploadError(null);
    try {
      console.log("Starting upload for file:", mediaFile.name, mediaFile.type);
      const res = await startUpload([mediaFile]);
      console.log("Upload response:", res);

      if (!res || res.length === 0) {
        throw new Error("Upload failed - no response from server");
      }

      const mediaUrl = res[0]?.url;
      if (!mediaUrl) {
        throw new Error("Upload failed - no URL in response");
      }

      console.log("Upload successful, URL:", mediaUrl);

      await createStory({
        clerkId: user.id,
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
        privacy,
      });

      setCaption("");
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      setUploadProgress(0);
      setUploadComplete(false);
      setPrivacy("everyone");
      onClose();
    } catch (error) {
      console.error("Error creating story:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCaption("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);
    setPrivacy("everyone");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Privacy Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Who can see your story?</label>
            <Select
              value={privacy}
              onValueChange={(value: "everyone" | "followers") =>
                setPrivacy(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Everyone</span>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Followers only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Caption */}
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            className="resize-none"
            rows={2}
          />

          {/* Error Display */}
          {uploadError && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {uploadError}
            </div>
          )}

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden">
              {mediaType === "video" ? (
                <video
                  src={mediaPreview}
                  className="w-full rounded-lg max-h-64"
                  controls
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt=""
                  className="w-full rounded-lg object-cover max-h-64"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  setMediaType(null);
                  setUploadError(null);
                  setUploadProgress(0);
                  setUploadComplete(false);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Upload Progress */}
              {isUploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Complete */}
              {uploadComplete && !isUploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white p-2 text-center text-sm font-medium">
                  Uploaded
                </div>
              )}
            </div>
          )}

          {/* File Selectors */}
          {!mediaPreview && (
            <div className="grid grid-cols-2 gap-4">
              <label
                htmlFor="story-image"
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add Photo</span>
                <input
                  id="story-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <label
                htmlFor="story-video"
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <VideoIcon className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add Video</span>
                <input
                  id="story-video"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {/* Selected Indicator */}
          {mediaPreview && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {mediaType === "image" ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <VideoIcon className="w-4 h-4" />
              )}
              <span>
                {mediaType === "image" ? "Photo" : "Video"} selected
              </span>
              <Check className="w-4 h-4 text-green-500" />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={loading || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || isUploading || !mediaFile}
            >
              {loading || isUploading ? "Creating..." : "Share Story"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
