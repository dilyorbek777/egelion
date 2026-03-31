"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";
import { Bell, Heart, MessageCircle, Bookmark, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {   Skeleton } from "@/components/loading";
import Link from "next/link";
import { toast } from "sonner";

export function Notifications() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useQuery(
    api.interactions.getNotifications,
    clerkId ? { clerkId } : "skip"
  );
  const unreadCount = useQuery(
    api.interactions.getUnreadCount,
    clerkId ? { clerkId } : "skip"
  );
  const markRead = useMutation(api.interactions.markNotificationRead);
  const prevNotificationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (notifications === undefined) return;
    
    const currentIds = notifications.map(n => n._id);
    const prevIds = prevNotificationsRef.current;
    
    const newNotifications = notifications.filter(n => !prevIds.includes(n._id) && !n.read);
    
    newNotifications.forEach(notification => {
      const icon = getNotificationIcon(notification.type);
      toast(
        <div className="flex items-center gap-2">
          {icon}
          <span>
            {getNotificationText(
              notification.type,
              notification.actor?.fullName,
              notification.actor?.username,
              notification.post?._id
            )}
          </span>
        </div>,
        { duration: 4000 }
      );
    });
    
    prevNotificationsRef.current = currentIds;
  }, [notifications]);

  const handleMarkRead = async (notificationId: Id<"notifications">) => {
    if (!clerkId) return;
    await markRead({ clerkId, notificationId });
  };

  const getNotificationIcon = (type: "like" | "comment" | "save" | "follow") => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "save":
        return <Bookmark className="w-4 h-4 text-yellow-500 fill-current" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-500" />;
    }
  };

  const getNotificationText = (
    type: "like" | "comment" | "save" | "follow",
    actorName?: string,
    username?: string,
    postId?: string
  ) => {
    if (!actorName) return null;
    const actorLink = <Link href={`/profile/${username || actorName}`} className="hover:underline">@{username || actorName}</Link>;
    const postLink = postId ? <Link href={`/post/${postId}`} className="hover:underline">your post</Link> : "your post";
    switch (type) {
      case "like":
        return <>{actorLink} liked {postLink}</>;
      case "comment":
        return <>{actorLink} commented on {postLink}</>;
      case "save":
        return <>{actorLink} saved {postLink}</>;
      case "follow":
        return <>{actorLink} started following you</>;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount === undefined ? (
          <Skeleton className="absolute -top-1 -right-1 w-5 h-5 rounded-full" />
        ) : unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="divide-y">
            {notifications === undefined ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
                  onClick={() => handleMarkRead(notification._id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {getNotificationText(
                          notification.type,
                          notification.actor?.fullName,
                          notification.actor?.username,
                          notification.post?._id
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{notification.actor?.username}
                      </p>
                      {notification.post?.content && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {notification.post.content}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
