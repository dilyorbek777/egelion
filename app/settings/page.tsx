"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLoading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Bell, Shield, User, ChevronRight, Pencil, Trash2, Clock, Film } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dbUser = useQuery(api.users.getByClerkId, { clerkId: user?.id ?? "" });
  const deleteAccount = useMutation(api.users.deleteAccount);

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
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {dbUser.profileImage ? (
                <img
                  src={dbUser.profileImage}
                  alt={dbUser.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xl font-bold text-primary border-2 border-border">
                  {dbUser.fullName[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{dbUser.fullName}</p>
                <p className="text-sm text-muted-foreground truncate">@{dbUser.username}</p>
              </div>
              <Link href={`/profile/${dbUser.username}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit Profile
                </Button>
              </Link>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-around text-center">
              <div>
                <div className="font-semibold">{dbUser.postsCount ?? 0}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div>
                <div className="font-semibold">{dbUser.followersCount ?? 0}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div>
                <div className="font-semibold">{dbUser.followingCount ?? 0}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
            </div>

            <Separator className="my-4" />
            
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
            <Link href="/stories">
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:underline">
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4" />
                  <span>Your Stories</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
            <Separator />
            <Link href="/stories/archived">
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent hover:underline">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" />
                  <span>Archived Stories</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
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
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 h-auto py-3 px-0"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              All your posts, likes, comments, and data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  async function handleDeleteAccount() {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      await deleteAccount({ clerkId: user.id });
      setShowDeleteDialog(false);
      router.push("/");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
    }
  }
}
