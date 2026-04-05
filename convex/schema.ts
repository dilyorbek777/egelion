import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    fullName: v.string(),
    profileImage: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    isProfileComplete: v.boolean(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  posts: defineTable({
    authorId: v.id("users"),
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    likesCount: v.number(),
    commentsCount: v.number(),
    savesCount: v.number(),
  }).index("by_author", ["authorId"]),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user_post", ["userId", "postId"])
    .index("by_post", ["postId"]),

  saves: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user_post", ["userId", "postId"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
  }).index("by_post", ["postId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("like"), v.literal("comment"), v.literal("save"), v.literal("follow"), v.literal("message")),
    actorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    conversationId: v.optional(v.id("conversations")),
    read: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  deletedUsers: defineTable({
    clerkId: v.string(),
    username: v.string(),
    fullName: v.string(),
    profileImage: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    isProfileComplete: v.boolean(),
    originalId: v.id("users"),
    deletedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  stories: defineTable({
    authorId: v.id("users"),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    privacy: v.union(v.literal("everyone"), v.literal("followers")),
    status: v.union(v.literal("active"), v.literal("archived")),
    expiresAt: v.number(),
    viewsCount: v.number(),
    likesCount: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_status_author", ["status", "authorId"])
    .index("by_expiresAt", ["expiresAt"]),

  storyViews: defineTable({
    storyId: v.id("stories"),
    userId: v.id("users"),
    viewedAt: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_user_story", ["userId", "storyId"]),

  storyLikes: defineTable({
    storyId: v.id("stories"),
    userId: v.id("users"),
    likedAt: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_user_story", ["userId", "storyId"])
    .index("by_story_user", ["storyId", "userId"]),

  conversations: defineTable({
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageAt: v.optional(v.number()),
  }),

  conversationParticipants: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
    isTyping: v.optional(v.boolean()),
    typingUpdatedAt: v.optional(v.number()),
    isUploading: v.optional(v.boolean()),
    uploadingUpdatedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    replyToId: v.optional(v.id("messages")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_created", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId"]),
});