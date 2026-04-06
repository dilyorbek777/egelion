import type { Metadata } from "next";
import { StoriesPageClient } from "./client";

export const metadata: Metadata = {
  title: "Your Stories | Egelion",
  description: "Manage your stories on Egelion. View active and archived stories.",
};

export default function StoriesPage() {
  return <StoriesPageClient />;
}
