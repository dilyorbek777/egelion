"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Bell, Shield, User, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const dbUser = useQuery(api.users.getByClerkId, { clerkId: user?.id ?? "" });

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (dbUser && !dbUser.isProfileComplete) {
      router.push("/profile-complete");
    }
  }, [dbUser, router]);

  if (!user || !dbUser) {
    return <PageLoading text="Loading settings..." />;
  }

  if (!dbUser.isProfileComplete) {
    return <PageLoading text="Setting up your profile..." />;
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={dbUser.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{dbUser.fullName}</p>
                <p className="text-sm text-muted-foreground truncate">@{dbUser.username}</p>
              </div>
            </div>
            <Separator />
            <Link href={`/profile/${dbUser.username}`}>
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:underline">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <span>View Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your app experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                <span>Dark Mode</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "Disable" : "Enable"}
              </Button>
            </div>
            <Separator />
            <Link href="/notifications">
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:underline">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security & Privacy</CardTitle>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:underline">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <span>Privacy Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:underline">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <span>Change Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <SignOutButton>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 h-auto py-3 px-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </SignOutButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
