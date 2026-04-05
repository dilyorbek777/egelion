"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PostCard } from "@/components/post-card";
import { Id } from "@/convex/_generated/dataModel";
import { use } from "react";

interface PostModalProps {
  post: {
    _id: Id<"posts">;
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    likesCount: number;
    commentsCount: number;
    savesCount: number;
    authorId: Id<"users">;
    author?: { username: string; profileImage?: string | null; fullName: string } | null;
  };
}

export function PostModal({ post }: PostModalProps) {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post</DialogTitle>
        </DialogHeader>
        <PostCard post={post}  />
      </DialogContent>
    </Dialog>
  );
}
