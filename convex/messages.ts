import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all conversations for a user
export const getConversations = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return [];

    const participants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const conversationsWithDetails = await Promise.all(
      participants.map(async (participant) => {
        const conversation = await ctx.db.get(participant.conversationId);
        if (!conversation) return null;

        // Get other participants
        const allParticipants = await ctx.db
          .query("conversationParticipants")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", participant.conversationId)
          )
          .collect();

        const otherParticipants = await Promise.all(
          allParticipants
            .filter((p) => p.userId !== user._id)
            .map(async (p) => {
              const userDetails = await ctx.db.get(p.userId);
              return userDetails;
            })
        );

        // Get last message
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation_created", (q) =>
            q.eq("conversationId", participant.conversationId)
          )
          .order("desc")
          .take(1);

        // Get unread count
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", participant.conversationId)
          )
          .collect();

        const unreadCount = messages.filter(
          (m) =>
            m.senderId !== user._id &&
            (!participant.lastReadAt || m.createdAt > participant.lastReadAt)
        ).length;

        return {
          conversation,
          participants: otherParticipants.filter(Boolean),
          lastMessage: lastMessage[0] || null,
          unreadCount,
          currentUserParticipant: participant,
        };
      })
    );

    return conversationsWithDetails
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b?.conversation.lastMessageAt || b?.conversation.createdAt || 0) -
          (a?.conversation.lastMessageAt || a?.conversation.createdAt || 0)
      );
  },
});

// Get or create a conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    clerkId: v.string(),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, { clerkId, otherUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Check if conversation already exists
    const userConversations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const participant of userConversations) {
      const allParticipants = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", participant.conversationId)
        )
        .collect();

      const otherParticipant = allParticipants.find(p => p.userId === otherUserId);

      if (otherParticipant) {
        return participant.conversationId;
      }
    }

    // Create new conversation
    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      createdAt: now,
      updatedAt: now,
    });

    // Add participants
    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId: user._id,
      joinedAt: now,
    });

    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId: otherUserId,
      joinedAt: now,
    });

    return conversationId;
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, conversationId, cursor, limit = 50 }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return { messages: [], nextCursor: null };

    // Check if user is participant
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", conversationId)
      )
      .first();

    if (!participant) throw new Error("Not a participant");

    let queryBuilder = ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("desc");

    const messages = await queryBuilder.take(limit);

    // Get sender details for each message
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        let replyTo = null;
        if (message.replyToId) {
          const replyMsg = await ctx.db.get(message.replyToId);
          if (replyMsg) {
            const replySender = await ctx.db.get(replyMsg.senderId);
            replyTo = {
              ...replyMsg,
              sender: replySender,
            };
          }
        }
        return {
          ...message,
          sender,
          replyTo,
        };
      })
    );

    // Cannot update lastRead in a query - this needs to be done via separate mutation
    // The client should call markAsRead after loading messages

    return {
      messages: messagesWithSender.reverse(),
      nextCursor:
        messages.length === limit
          ? messages[messages.length - 1].createdAt.toString()
          : null,
    };
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is participant
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId)
      )
      .first();

    if (!participant) throw new Error("Not a participant");

    if (!args.content && !args.mediaUrl) {
      throw new Error("Message must have content or media");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      content: args.content,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      createdAt: now,
      replyToId: args.replyToId,
    });

    // Update conversation last message time
    await ctx.db.patch(args.conversationId, {
      updatedAt: now,
      lastMessageAt: now,
    });

    // Create notifications for other participants
    const allParticipants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const participant of allParticipants) {
      if (participant.userId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: participant.userId,
          type: "message",
          actorId: user._id,
          conversationId: args.conversationId,
          read: false,
        });
      }
    }

    return messageId;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    clerkId: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, { clerkId, messageId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== user._id) {
      throw new Error("Can only delete own messages");
    }

    await ctx.db.patch(messageId, {
      isDeleted: true,
      content: undefined,
      mediaUrl: undefined,
      mediaType: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Mark conversation as read
export const markAsRead = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { clerkId, conversationId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", conversationId)
      )
      .first();

    if (!participant) throw new Error("Not a participant");

    await ctx.db.patch(participant._id, {
      lastReadAt: Date.now(),
    });

    return { success: true };
  },
});

// Get conversation details
export const getConversation = query({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { clerkId, conversationId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return null;

    // Check if user is participant
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", conversationId)
      )
      .first();

    if (!participant) return null;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return null;

    // Get all participants
    const allParticipants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    const participantsWithDetails = await Promise.all(
      allParticipants.map(async (p) => {
        const userDetails = await ctx.db.get(p.userId);
        return {
          ...p,
          user: userDetails,
        };
      })
    );

    return {
      conversation,
      participants: participantsWithDetails,
      currentUserParticipant: participant,
    };
  },
});

// Update user's last seen timestamp
export const updateLastSeen = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      lastSeenAt: Date.now(),
    });

    return { success: true };
  },
});

// Search users to start a conversation
export const searchUsers = query({
  args: {
    clerkId: v.string(),
    query: v.string(),
  },
  handler: async (ctx, { clerkId, query }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return [];

    const users = await ctx.db.query("users").take(100);
    const searchLower = query.toLowerCase();

    return users.filter(
      (u) =>
        u._id !== user._id &&
        (u.username.toLowerCase().includes(searchLower) ||
          u.fullName.toLowerCase().includes(searchLower))
    );
  },
});

// Delete a conversation
export const deleteConversation = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { clerkId, conversationId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is a participant
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", conversationId)
      )
      .first();

    if (!participant) throw new Error("Not a participant");

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete all conversation participants
    const participants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const p of participants) {
      await ctx.db.delete(p._id);
    }

    // Delete the conversation
    await ctx.db.delete(conversationId);

    return { success: true };
  },
});
