// components/ProfileGuard.tsx
"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser"; // returns dbUser
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && (!user.username || !user.fullName) && pathname !== "/profile-complete") {
      router.replace("/profile-complete"); // force complete profile
    }
  }, [user, router, pathname]);

  if (user && (!user.username || !user.fullName) && pathname !== "/profile-complete") {
    return <p>Redirecting to complete your profile...</p>;
  }

  return <>{children}</>;
}