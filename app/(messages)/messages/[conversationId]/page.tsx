"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  X,
  Trash2,
  MoreVertical,
  Check,
  CheckCheck,
  CornerUpLeft,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { motion, AnimatePresence } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  createdAt: number;
  updatedAt?: number;
  isDeleted?: boolean;
  replyToId?: string;
  sender: {
    _id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  } | null;
  replyTo?: {
    _id: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    sender: {
      fullName: string;
    } | null;
  } | null;
}

interface ConversationDetails {
  conversation: {
    _id: string;
    createdAt: number;
    updatedAt: number;
    lastMessageAt?: number;
  };
  participants: Array<{
    _id: string;
    userId: string;
    user: {
      _id: string;
      username: string;
      fullName: string;
      profileImage?: string;
      lastSeenAt?: number;
    };
  }>;
  currentUserParticipant: {
    _id: string;
    lastReadAt?: number;
  };
}

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const emojis = ["😀", "😂", "🤣", "😊", "😍", "🥰", "😘", "😅", "😆", "😁", "🙂", "🙃", "😉", "😌", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦵", "🦿", "🦶", "👣", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🈳", "🈂", "🛂", "🛃", "🛄", "🛅", "🛗", "🚹", "🚺", "🚼", "⚧", "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🔢", "#️⃣", "*️⃣", "⏏️", "▶️", "⏸️", "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️", "⤴️", "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "✖️", "💲", "💱", "™️", "©️", "®️", "〰️", "➰", "➿", "🔚", "🔙", "🔛", "🔝", "🔜", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇", "🔉", "🔊", "🔔", "🔕", "📣", "📢", "💬", "💭", "🗯️", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴", "🀄", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛", "🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧"];

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const conversation = useQuery(
    api.messages.getConversation,
    clerkId && conversationId
      ? { clerkId, conversationId: conversationId as unknown as Id<"conversations"> }
      : "skip"
  );

  const messagesData = useQuery(
    api.messages.getMessages,
    clerkId && conversationId && conversation
      ? { clerkId, conversationId: conversationId as unknown as Id<"conversations">, limit: 100 }
      : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const markAsRead = useMutation(api.messages.markAsRead);
  const updateLastSeen = useMutation(api.messages.updateLastSeen);

  // Mark as read when opening conversation
  useEffect(() => {
    if (clerkId && conversationId && conversation) {
      markAsRead({ clerkId, conversationId: conversationId as unknown as Id<"conversations"> });
    }
  }, [clerkId, conversationId, conversation, markAsRead]);

  // Handle not found - conversation is explicitly null after loading
  if (conversation === null) {
    notFound();
  }

  // Track user's online status - update last seen periodically
  useEffect(() => {
    if (!clerkId) return;
    
    // Update immediately when component mounts
    updateLastSeen({ clerkId });
    
    // Update every minute while on this page
    const interval = setInterval(() => {
      updateLastSeen({ clerkId });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [clerkId, updateLastSeen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const handleSend = async () => {
    if (!clerkId || (!newMessage.trim() && !pendingMedia)) return;

    try {
      await sendMessage({
        clerkId,
        conversationId: conversationId as unknown as Id<"conversations">,
        content: newMessage.trim() || undefined,
        mediaUrl: pendingMedia?.url,
        mediaType: pendingMedia?.type,
        replyToId: replyingTo?._id as unknown as Id<"messages">,
      });
      setNewMessage("");
      setPendingMedia(null);
      setReplyingTo(null);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!clerkId) return;

    try {
      await deleteMessage({ clerkId, messageId: messageId as unknown as Id<"messages"> });
      toast.success("Message deleted");
      setMessageToDelete(null);
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherParticipant = conversation?.participants.find(
    (p) => p._id !== conversation?.currentUserParticipant._id
  )?.user;

  const messages = messagesData?.messages || [];

  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Helper to format online status based on lastSeenAt
  const getOnlineStatus = useCallback((lastSeenAt?: number): { text: string; isOnline: boolean } => {
    if (!lastSeenAt) {
      return { text: "Offline", isOnline: false };
    }

    const now = Date.now();
    const diff = now - lastSeenAt;
    const diffMinutes = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);

    // Online if active within last 2 minutes
    if (diffMinutes < 2) {
      return { text: "Online", isOnline: true };
    }

    // Show minutes ago for less than an hour
    if (diffMinutes < 60) {
      return { text: `${diffMinutes}m ago`, isOnline: false };
    }

    // Show hours ago for less than a day
    if (diffHours < 24) {
      return { text: `${diffHours}h ago`, isOnline: false };
    }

    // Show days ago for less than 7 days
    if (diffDays < 7) {
      return { text: `${diffDays}d ago`, isOnline: false };
    }

    // After 7 days, show the date like "Active on Apr 3rd"
    const date = new Date(lastSeenAt);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    
    // Get ordinal suffix
    const getOrdinal = (n: number): string => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return { text: `Active on ${month} ${day}${getOrdinal(day)}`, isOnline: false };
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  }, []);

  // Group messages by date and check for consecutive messages
  const groupedMessages = messages.reduce((groups, message, index) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    
    const prevMessage = messages[index - 1];
    const isConsecutive = prevMessage && 
      prevMessage.sender?._id === message.sender?._id &&
      message.createdAt - prevMessage.createdAt < 300000; // 5 minutes
    
    groups[date].push({ ...message, isConsecutive });
    return groups;
  }, {} as Record<string, (Message & { isConsecutive: boolean })[]>);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col overflow-hidden">
        {/* Modern Glassmorphism Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 w-full z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              
              {otherParticipant ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-11 w-11 ring-2 ring-border ring-offset-2 ring-offset-background">
                      <AvatarImage src={otherParticipant.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {otherParticipant.fullName?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    {(() => {
                      const { isOnline } = getOnlineStatus(otherParticipant.lastSeenAt);
                      return (
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background",
                          isOnline ? "bg-emerald-500" : "bg-gray-400"
                        )} />
                      );
                    })()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground leading-tight">
                      {otherParticipant.fullName}
                    </p>
                    {(() => {
                      const { text, isOnline } = getOnlineStatus(otherParticipant.lastSeenAt);
                      return (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className={cn(
                            "inline-block w-1.5 h-1.5 rounded-full",
                            isOnline ? "bg-emerald-500" : "bg-gray-400"
                          )} />
                          {text}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              )}
            </div>

            
          </div>
        </motion.div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full scroll-smooth"
        >
          {messages.length === 0 && !messagesData ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "flex-row-reverse" : "flex-row")}>
                  <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                  <div className={cn("space-y-2", i % 2 === 0 ? "items-end" : "items-start")}>
                    <div className="h-10 w-48 bg-muted animate-pulse rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No messages yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Send a message to start the conversation with {otherParticipant?.fullName}
              </p>
            </motion.div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages], dateIndex) => (
              <motion.div 
                key={date} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: dateIndex * 0.1 }}
                className="space-y-1"
              >
                {/* Elegant Date Separator */}
                <div className="flex items-center justify-center py-4">
                  <div className="bg-muted/50 backdrop-blur-sm px-4 py-1.5 rounded-full">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatDate(dateMessages[0].createdAt)}
                    </span>
                  </div>
                </div>

                {dateMessages.map((message, index) => {
                  const isCurrentUser = message.sender?._id === conversation?.currentUserParticipant.userId;
                  const showAvatar = !isCurrentUser && !message.isConsecutive;
                  const isHovered = hoveredMessageId === message._id;

                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      onMouseEnter={() => setHoveredMessageId(message._id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      className={cn(
                        "flex gap-2 group relative",
                        isCurrentUser ? "flex-row-reverse" : "flex-row",
                        message.isConsecutive ? "mt-0.5" : "mt-3"
                      )}
                    >
                      {!isCurrentUser && (
                        <div className={cn("w-9 shrink-0 transition-all duration-300", 
                          showAvatar ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        )}>
                          {showAvatar && (
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={message.sender?.profileImage} />
                              <AvatarFallback className="text-xs bg-muted">
                                {message.sender?.fullName?.[0]?.toUpperCase() ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}

                      <div className={cn(
                        "flex flex-col max-w-[75%]",
                        isCurrentUser ? "items-end" : "items-start"
                      )}>
                        {!isCurrentUser && showAvatar && (
                          <span className="text-xs text-muted-foreground ml-1 mb-1">
                            {message.sender?.fullName}
                          </span>
                        )}

                        <AnimatePresence>
                          {message.replyTo && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className={cn(
                                "mb-1 px-3 py-2 rounded-lg text-xs border-l-2",
                                isCurrentUser
                                  ? "bg-primary/10 border-primary rounded-br-sm"
                                  : "bg-muted border-muted-foreground/30 rounded-bl-sm"
                              )}
                            >
                              <p className="font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                                {message.replyTo.sender?.fullName ?? "Unknown"}
                              </p>
                              <p className="truncate max-w-[200px] text-foreground/80">
                                {message.replyTo.content || (
                                  message.replyTo.mediaType === "image" ? "📷 Photo" : "🎥 Video"
                                )}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="relative">
                          <div
                            className={cn(
                              "relative px-4 py-2.5 rounded-2xl shadow-sm",
                              isCurrentUser
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md",
                              message.isDeleted && "italic opacity-60 bg-muted/50",
                              "transition-all duration-200"
                            )}
                          >
                            {message.mediaUrl && !message.isDeleted && (
                              <div className="mb-2 -mx-1">
                                {message.mediaType === "image" ? (
                                  <button
                                    onClick={() => setSelectedImage(message.mediaUrl!)}
                                    className="block overflow-hidden rounded-xl hover:opacity-95 transition-opacity"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={message.mediaUrl}
                                      alt="Shared image"
                                      className="max-w-full max-h-64 object-cover rounded-xl"
                                      loading="lazy"
                                    />
                                  </button>
                                ) : message.mediaType === "video" ? (
                                  <video
                                    src={message.mediaUrl}
                                    controls
                                    className="max-w-full max-h-64 rounded-xl"
                                  />
                                ) : null}
                              </div>
                            )}

                            {message.content && (
                              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                                {message.content}
                              </p>
                            )}

                            <div className={cn(
                              "flex items-center gap-1 mt-1",
                              isCurrentUser ? "justify-end" : "justify-start"
                            )}>
                              <span className={cn(
                                "text-[10px]",
                                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {formatTime(message.createdAt)}
                              </span>
                              {isCurrentUser && (
                                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              )}
                              {message.updatedAt && message.updatedAt !== message.createdAt && (
                                <span className={cn(
                                  "text-[10px] italic",
                                  isCurrentUser ? "text-primary-foreground/50" : "text-muted-foreground/70"
                                )}>
                                  edited
                                </span>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isHovered && !message.isDeleted && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={cn(
                                  "absolute -top-2 flex items-center gap-1 bg-background border shadow-lg rounded-full p-1 z-10",
                                  isCurrentUser ? "-left-2" : "-right-2"
                                )}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-full hover:bg-muted"
                                      onClick={() => setReplyingTo(message)}
                                    >
                                      <CornerUpLeft className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Reply</TooltipContent>
                                </Tooltip>
                                
                                {isCurrentUser && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setMessageToDelete(message._id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Modern Input Area */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-4"
        >
          <div className="max-w-3xl mx-auto w-full fixed left-1/2 -translate-x-1/2 bottom-18 space-y-3 max-sm:space-y-1">
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  className="flex items-center gap-3 bg-muted/70 rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Replying to <span className="text-foreground">{replyingTo.sender?.fullName ?? "Unknown"}</span>
                    </p>
                    <p className="text-sm text-foreground truncate">
                      {replyingTo.content || (replyingTo.mediaType === "image" ? "📷 Photo" : "🎥 Video")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full shrink-0"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {pendingMedia && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    {pendingMedia.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pendingMedia.url}
                        alt="Upload preview"
                        className="h-24 w-24 object-cover rounded-xl border-2 border-primary/20"
                      />
                    ) : (
                      <video
                        src={pendingMedia.url}
                        className="h-24 w-24 object-cover rounded-xl border-2 border-primary/20"
                      />
                    )}
                    <button
                      onClick={() => setPendingMedia(null)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">Ready to send</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
                
                <UploadButton<OurFileRouter, "messageMedia">
                  endpoint="messageMedia"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) {
                      setPendingMedia({
                        url: res[0].ufsUrl || res[0].url,
                        type: "image",
                      });
                    }
                    setIsUploading(false);
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(error.message);
                    setIsUploading(false);
                  }}
                  onUploadBegin={() => setIsUploading(true)}
                  appearance={{
                    button: "h-10 w-10 flex items-center justify-center rounded-full border-0 bg-transparent hover:bg-muted transition-colors",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    ),
                  }}
                />
              </div>

              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isUploading}
                  className="min-h-[44px] max-h-32 py-3 pr-12 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                />
                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
                    >
                      <Smile className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="end">
                    <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleSend}
                disabled={isUploading || (!newMessage.trim() && !pendingMedia)}
                size="icon"
                className={cn(
                  "h-11 w-11 rounded-full shrink-0 transition-all duration-200",
                  (newMessage.trim() || pendingMedia)
                    ? "bg-primary hover:bg-primary/90 scale-100"
                    : "bg-muted scale-95"
                )}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className={cn(
                    "h-5 w-5 transition-transform",
                    (newMessage.trim() || pendingMedia) && "translate-x-0.5 -translate-y-0.5"
                  )} />
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Image Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Delete Message</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => messageToDelete && handleDelete(messageToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
