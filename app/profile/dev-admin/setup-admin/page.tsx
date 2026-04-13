"use client";

import { useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldOff } from "lucide-react";
import { useState } from "react";

export default function SetupAdminPage() {
  const { user: clerkUser } = useUser();
  const dbUser = useCurrentUser();
  const setAdminStatus = useMutation(api.users.setAdminStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleAdmin = async () => {
    if (!clerkUser || !dbUser) return;
    
    setIsLoading(true);
    try {
      await setAdminStatus({
        clerkId: clerkUser.id,
        isAdmin: !dbUser.isAdmin,
      });
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please sign in to access admin setup.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {dbUser?.isAdmin ? (
              <>
                <Shield className="h-5 w-5 text-green-600" />
                Admin Status Active
              </>
            ) : (
              <>
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
                Admin Status Inactive
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="font-medium">{dbUser?.fullName || "Unknown User"}</p>
            <p className="text-sm text-muted-foreground">@{dbUser?.username || "no-username"}</p>
          </div>
          
          <Button 
            onClick={handleToggleAdmin}
            disabled={isLoading || !dbUser}
            className="w-full"
            variant={dbUser?.isAdmin ? "destructive" : "default"}
          >
            {isLoading ? (
              "Processing..."
            ) : dbUser?.isAdmin ? (
              "Remove Admin Access"
            ) : (
              "Grant Admin Access"
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            This page allows you to toggle admin privileges for your account.
            Admin users can access the dev admin panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
