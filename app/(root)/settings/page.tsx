import type { Metadata } from "next";
import { SettingsPageClient } from "./client";

export const metadata: Metadata = {
  title: "Settings | Egelion",
  description: "Manage your account settings, preferences, and privacy on Egelion.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
