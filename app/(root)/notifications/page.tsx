import type { Metadata } from "next";
import { NotificationsPageClient } from "./client";

export const metadata: Metadata = {
  title: "Notifications | Egelion",
  description: "View your notifications - likes, comments, saves, follows, and messages.",
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
