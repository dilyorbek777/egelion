import type { Metadata } from "next";
import { SearchPageClient } from "./client";

export const metadata: Metadata = {
  title: "Search | Egelion",
  description: "Search for posts, users, and content on Egelion.",
};

export default function SearchPage() {
  return <SearchPageClient />;
}
