"use client";

import { useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/loading";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const dbUser = useCurrentUser();
  const router = useRouter();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (isClerkLoaded && !clerkUser) {
      router.replace("/sign-in");
      return;
    }

    if (dbUser && !dbUser.isAdmin) {
      router.replace("/");
      return;
    }
  }, [clerkUser, dbUser, isClerkLoaded, router]);

  // Show loading while checking auth
  if (!isClerkLoaded || (clerkUser && dbUser === undefined)) {
    return <PageLoading text="Checking permissions..." />;
  }

  // Show not admin message
  if (clerkUser && dbUser && !dbUser.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. This area is restricted to administrators only.
          </p>
          <Button onClick={() => router.replace("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Show not authenticated message
  if (!clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">
            You need to be signed in to access this page.
          </p>
          <Button onClick={() => router.replace("/sign-in")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
