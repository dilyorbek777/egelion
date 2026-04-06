import type { Metadata } from "next";
import { CreatePostPageClient } from "./client";

export const metadata: Metadata = {
  title: "Create Post | Egelion",
  description: "Share your thoughts, photos, and videos with your followers on Egelion.",
};

export default function CreatePostPage() {
  return <CreatePostPageClient />;
}
