"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StoryViewer } from "@/components/story-viewer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface StoryUserPageProps {
  params: Promise<{ userId: string }>;
}

export default function StoryUserPage({ params }: StoryUserPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  const stories = useQuery(
    api.stories.getStoriesByUser,
    clerkId && userId
      ? { clerkId, targetUserId: userId as Id<"users"> }
      : "skip"
  );

  const filteredStories = stories?.filter((s) => s.privacy === "everyone") ?? [];

  const handleClose = () => {
    // Navigate to home when closing from full page
    router.push("/");
  };

  const handleNext = () => {
    // Single user stories - go home when done
    router.push("/");
  };

  const handlePrevious = () => {
    router.push("/");
  };

  if (filteredStories.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white">No stories available</div>
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
