// components/ProfileGuard.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { PageLoading } from "@/components/loading";
import { useEffect } from "react";

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const dbUser = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const upsertUser = useMutation(api.users.upsertFromClerk);

  // Save user info when authenticated
  useEffect(() => {
    if (clerkUser && clerkUser.primaryEmailAddress) {
      upsertUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress.emailAddress,
      });
    }
  }, [clerkUser, upsertUser]);

  // Redirect if profile incomplete
  useEffect(() => {
    if (dbUser && !dbUser.isProfileComplete && pathname !== "/profile-complete") {
      router.replace("/profile-complete");
    }
  }, [dbUser, router, pathname]);

  if (!isClerkLoaded || (clerkUser && dbUser === undefined)) {
    return <PageLoading text="Loading your profile..." />;
  }

  if (dbUser && !dbUser.isProfileComplete && pathname !== "/profile-complete") {
    return <p>Redirecting to complete your profile...</p>;
  }

  return <>{children}</>;
}