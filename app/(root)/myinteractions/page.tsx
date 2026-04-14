import type { Metadata } from "next";
import { MyInteractionsClient } from "./client";

export const metadata: Metadata = {
  title: "My Interactions | Egelion",
  description: "View your liked posts, videos, and following users on Egelion.",
};

export default function MyInteractionsPage() {
  return <MyInteractionsClient />;
}
