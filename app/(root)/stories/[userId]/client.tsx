"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StoryViewer } from "@/components/story-viewer";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";


interface StoryUserPageClientProps {
  userId: string;
}

export function StoryUserPageClient({ userId }: StoryUserPageClientProps) {
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id;

  const stories = useQuery(
    api.stories.getStoriesByUsername,
    clerkId
      ? { clerkId, username: userId }
      : "skip"
  );

  const filteredStories = stories?.filter((s) => s.privacy === "everyone") ?? [];

  const handleClose = () => {
    router.push("/");
  };

  const handleNext = () => {
    router.push("/");
  };

  const handlePrevious = () => {
    router.push("/");
  };

  if (filteredStories.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center flex  items-center gap-2 flex-col ">
          <div className="text-white mb-4">No stories available</div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white text-black flex  items-center gap-2 rounded-lg hover:bg-gray-200 transition-colors"
          > <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    );
  }

  const storyGroup = {
    author: filteredStories[0]?.author || null,
    stories: filteredStories,
    hasUnviewed: filteredStories.some((s) => !s.hasViewed),
  };

  return (
    <StoryViewer
      storyGroups={[storyGroup]}
      currentGroupIndex={0}
      onClose={handleClose}
      onNext={handleNext}
      onPrevious={handlePrevious}
    />
  );
}
