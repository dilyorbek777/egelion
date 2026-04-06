import type { Metadata } from "next";
import { CreateStoryPageClient } from "./client";

export const metadata: Metadata = {
  title: "Create Story | Egelion",
  description: "Share a photo or video story with your followers on Egelion. Stories disappear after 24 hours.",
};

export default function CreateStoryPage() {
  return <CreateStoryPageClient />;
}
