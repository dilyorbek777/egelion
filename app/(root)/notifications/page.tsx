"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Heart, MessageCircle, Bookmark, UserPlus, Bell, Mail, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  userId: string;
  type: "like" | "comment" | "save" | "follow" | "message" | "post" | "story";
  actorId: string;
  postId?: string;
  read: boolean;
  actor?: {
    _id: string;
    username: string;
    fullName: string;
    profileImage?: string | null;
  } | null;
  post?: {
    _id: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
  } | null;
}

const notificationIcons = {
  like: Heart,
  comment: MessageCircle,
  save: Bookmark,
  follow: UserPlus,
  message: Mail,
  post: Bell,
  story: Bell,
};

const notificationColors = {
  like: "text-red-500",
  comment: "text-blue-500",
  save: "text-yellow-500",
  follow: "text-green-500",
  message: "text-purple-500",
  post: "text-primary",
  story: "text-pink-500",
};

const getNotificationText = (notification: Notification): string => {
  const actorName = notification.actor?.username || "Someone";
  switch (notification.type) {
    case "like":
      return `${actorName} liked your post`;
    case "comment":
      return `${actorName} commented on your post`;
    case "save":
      return `${actorName} saved your post`;
    case "follow":
      return `${actorName} started following you`;
    case "message":
      return `${actorName} sent you a message`;
    case "post":
      return `${actorName} created a new post`;
    case "story":
      return `${actorName} shared a story`;
    default:
      return "You have a new notification";
  }
};

export default function NotificationsPage() {
  const { user } = useUser();
  const router = useRouter();
  const clerkId = user?.id ?? "";
  const notifications = useQuery(
    api.interactions.getNotifications,
    clerkId ? { clerkId } : "skip"
  );
  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const markRead = useMutation(api.interactions.markNotificationRead);
  const markAllRead = useMutation(api.interactions.markAllNotificationsRead);

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
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dbUser.isProfileComplete) {
    return null;
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markRead({ clerkId, notificationId: notification._id as Id<"notifications"> });
    }
    if (notification.postId) {
      router.push(`/post/${notification.postId}`);
    } else if (notification.actorId) {
      router.push(`/profile/${notification.actor?.username}`);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => clerkId && markAllRead({ clerkId })}
            className="hover:bg-primary/90"
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications === undefined ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No notifications yet. When someone likes, comments, saves your posts, or follows you, you'll see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: Notification) => {
            const Icon = notificationIcons[notification.type];
            const colorClass = notificationColors[notification.type];
            return (
              <Card
                key={notification._id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  !notification.read && "bg-muted/30 border-primary/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notification.actor?.profileImage ?? undefined} />
                        <AvatarFallback>
                          {notification.actor?.fullName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border flex items-center justify-center",
                          colorClass
                        )}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {notification.actor?.fullName || "Someone"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {getNotificationText(notification).replace(
                            notification.actor?.username || "Someone",
                            ""
                          )}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.post?.content
                          ? `"${notification.post.content.slice(0, 50)}${
                              notification.post.content.length > 50 ? "..." : ""
                            }"`
                          : notification.type === "follow"
                          ? "New follower"
                          : "View post"}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
