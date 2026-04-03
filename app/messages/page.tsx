"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, ArrowLeft, Trash2, MoreVertical } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ConversationWithDetails {
  conversation: {
    _id: string;
    _creationTime: number;
    createdAt: number;
    updatedAt: number;
    lastMessageAt?: number;
  };
  participants: Array<{
    _id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  }>;
  lastMessage: {
    _id: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    createdAt: number;
    senderId: string;
    isDeleted?: boolean;
  } | null;
  unreadCount: number;
  currentUserParticipant: {
    _id: string;
    lastReadAt?: number;
  };
}

interface UserSearchResult {
  _id: Id<"users">;
  username: string;
  fullName: string;
  profileImage?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const conversations = useQuery(
    api.messages.getConversations,
    clerkId ? { clerkId } : "skip"
  );

  const searchResults = useQuery(
    api.messages.searchUsers,
    clerkId && searchQuery.length > 1
      ? { clerkId, query: searchQuery }
      : "skip"
  );

  const getOrCreateConversation = useMutation(
    api.messages.getOrCreateConversation
  );

  const deleteConversation = useMutation(
    api.messages.deleteConversation
  );

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clerkId || !conversationToDelete) return;
    try {
      await deleteConversation({
        clerkId,
        conversationId: conversationToDelete as Id<"conversations">,
      });
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleUserClick = async (otherUserId: Id<"users">) => {
    if (!clerkId) return;
    try {
      const conversationId = await getOrCreateConversation({
        clerkId,
        otherUserId,
      });
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const formatLastMessage = (message: ConversationWithDetails["lastMessage"]) => {
    if (!message) return "No messages yet";
    if (message.isDeleted) return "Message deleted";
    if (message.mediaType === "image") return "📷 Photo";
    if (message.mediaType === "video") return "🎥 Video";
    return message.content || "";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            {showSearch ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 mx-2">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold">Messages</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showSearch && searchResults && searchResults.length === 0 && searchQuery.length > 1 && (
          <div className="p-4 text-center text-muted-foreground">
            No users found
          </div>
        )}
        {showSearch && searchResults && searchResults.length > 0 && (
          <div className="border-b">
            {searchResults.map((user: UserSearchResult) => (
              <button
                key={user._id.toString()}
                onClick={() => handleUserClick(user._id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback>{user.fullName[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations List */}
        <div className="divide-y">
          {!conversations ? (
            // Loading state
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold mb-2">No messages yet</h2>
              <p className="text-muted-foreground max-w-xs">
                Start a conversation by searching for users above
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              if (!conv) return null;
              const otherUser = conv.participants[0];
              if (!otherUser) return null;

              const isUnread = conv.unreadCount > 0;

              return (
                <div
                  key={conv.conversation._id}
                  className={cn(
                    "flex items-center gap-3 p-4 hover:bg-muted transition-colors group",
                    isUnread && "bg-muted/50"
                  )}
                >
                  <Link
                    href={`/messages/${conv.conversation._id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser.profileImage} />
                      <AvatarFallback>{otherUser.fullName[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "truncate",
                            isUnread ? "font-semibold" : "font-medium"
                          )}
                        >
                          {otherUser.fullName}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm truncate flex-1",
                            isUnread
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatLastMessage(conv.lastMessage)}
                        </p>
                        {isUnread && (
                          <span className="shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(conv.conversation._id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete chat?</DialogTitle>
              <DialogDescription>
                This conversation will be removed from your messages. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
