import type { Metadata } from "next";
import { ArchivedStoriesPageClient } from "./client";

export const metadata: Metadata = {
  title: "Archived Stories | Egelion",
  description: "View your expired stories on Egelion. Stories are automatically archived after 24 hours.",
};

export default function ArchivedStoriesPage() {
  return <ArchivedStoriesPageClient />;
}
