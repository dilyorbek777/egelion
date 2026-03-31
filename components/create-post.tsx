"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, VideoIcon, X, Check } from "lucide-react";

export function CreatePost() {
  const { user } = useUser();
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
        
        mediaUrl = res[0]?.url;
        if (!mediaUrl) {
          throw new Error("Upload failed - no URL in response");
        }
        
        console.log("Upload successful, URL:", mediaUrl);
      }

      await createPost({
        clerkId: user.id,
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
    } catch (error) {
      console.error("Error creating post:", error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-3 bg-background">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="resize-none"
        rows={3}
      />

      {uploadError && (
        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
          {uploadError}
        </div>
      )}

      {mediaPreview && (
        <div className="relative">
          {mediaType === "video" ? (
            <video src={mediaPreview} className="w-full rounded-lg max-h-64" />
          ) : (
            <img src={mediaPreview} alt="" className="w-full rounded-lg object-cover max-h-64" />
          )}
          <button
            type="button"
            onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); setUploadError(null); setUploadProgress(0); setUploadComplete(false); }}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
          {isUploading && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 rounded-b-lg">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(uploadProgress)}%</span>
              </div>
            </div>
          )}
          {uploadComplete && !isUploading && (
            <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white p-2 rounded-b-lg text-center text-sm font-medium">
              Uploaded
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <label htmlFor="post-image" className={`cursor-pointer transition-colors relative ${mediaType === "image" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <ImageIcon className="w-5 h-5" />
            {mediaType === "image" && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
            <input id="post-image" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          <label htmlFor="post-video" className={`cursor-pointer transition-colors relative ${mediaType === "video" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <VideoIcon className="w-5 h-5" />
            {mediaType === "video" && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
            <input id="post-video" type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={loading || isUploading || (!content.trim() && !mediaFile)}
        >
          {loading || isUploading ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
