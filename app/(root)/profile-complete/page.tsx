import type { Metadata } from "next";
import { ProfileCompletePageClient } from "./client";

export const metadata: Metadata = {
  title: "Complete Your Profile | Egelion",
  description: "Set up your profile to start sharing posts and connecting with others on Egelion.",
};

export default function ProfileCompletePage() {
  return <ProfileCompletePageClient />;
}