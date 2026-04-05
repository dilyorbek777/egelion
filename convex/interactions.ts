import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Likes ──────────────────────────────────────────────
export const toggleLike = mutation({
  args: { clerkId: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { likesCount: Math.max(0, post.likesCount - 1) });
      return false;
    } else {
      await ctx.db.insert("likes", { userId: user._id, postId: args.postId });
      await ctx.db.patch(args.postId, { likesCount: post.likesCount + 1 });
      
      // Create notification for post author (if not liking own post)
      if (post.authorId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: post.authorId,
          type: "like",
          actorId: user._id,
          postId: args.postId,
          read: false,
        });
      }
      
      return true;
    }
  },
});

export const isLiked = query({
  args: { clerkId: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return false;
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();
    return !!like;
  },
});

// ── Saves ──────────────────────────────────────────────
export const toggleSave = mutation({
  args: { clerkId: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("saves")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { savesCount: Math.max(0, post.savesCount - 1) });
      return false;
    } else {
      await ctx.db.insert("saves", { userId: user._id, postId: args.postId });
      await ctx.db.patch(args.postId, { savesCount: post.savesCount + 1 });
      return true;
    }
  },
});

export const isSaved = query({
  args: { clerkId: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return false;
    
    const save = await ctx.db
      .query("saves")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();
    
    return !!save;
  },
});

export const getSavedPosts = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return [];

    const saves = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      saves.map(async (save) => {
        const post = await ctx.db.get(save.postId);
        if (!post) return null;
        const author = await ctx.db.get(post.authorId);
        return { ...post, author };
      })
    ).then((posts) => posts.filter((p): p is NonNullable<typeof p> => p !== null));
  },
});

// ── Comments ───────────────────────────────────────────
export const addComment = mutation({
  args: { clerkId: v.string(), postId: v.id("posts"), content: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    
    await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: args.content,
    });
    await ctx.db.patch(args.postId, { commentsCount: post.commentsCount + 1 });
    
    // Create notification for post author (if not commenting on own post)
    if (post.authorId !== user._id) {
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        type: "comment",
        actorId: user._id,
        postId: args.postId,
        read: false,
      });
    }
  },
});

export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("asc")
      .collect();
    return Promise.all(
      comments.map(async (c) => ({ ...c, author: await ctx.db.get(c.authorId) }))
    );
  },
});

// ── Follows ─────────────────────────────────────────────
export const toggleFollow = mutation({
  args: { clerkId: v.string(), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");

    // Prevent self-follow
    if (user._id === args.targetUserId) {
      throw new Error("Cannot follow yourself");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId)
      )
      .first();

    if (existing) {
      // Unfollow
      await ctx.db.delete(existing._id);
      return false;
    } else {
      // Follow
      await ctx.db.insert("follows", {
        followerId: user._id,
        followingId: args.targetUserId,
      });
      
      // Create notification for the followed user
      await ctx.db.insert("notifications", {
        userId: args.targetUserId,
        type: "follow",
        actorId: user._id,
        read: false,
      });
      
      return true;
    }
  },
});

export const isFollowing = query({
  args: { clerkId: v.string(), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return false;
    
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId)
      )
      .first();
    
    return !!follow;
  },
});

export const getFollowStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();
    
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    
    return {
      followersCount: followers.length,
      followingCount: following.length,
    };
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();
    
    return Promise.all(
      follows.map(async (f) => await ctx.db.get(f.followerId))
    );
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    
    return Promise.all(
      follows.map(async (f) => await ctx.db.get(f.followingId))
    );
  },
});
export const getNotifications = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      notifications.map(async (n) => ({
        ...n,
        actor: await ctx.db.get(n.actorId),
        post: n.postId ? await ctx.db.get(n.postId) : null,
        conversation: n.conversationId ? await ctx.db.get(n.conversationId) : null,
      }))
    );
  },
});

export const markNotificationRead = mutation({
  args: { clerkId: v.string(), notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");
    
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found");
    }
    
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllNotificationsRead = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");
    
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();
    
    await Promise.all(
      unreadNotifications.map((n) => ctx.db.patch(n._id, { read: true }))
    );
    
    return unreadNotifications.length;
  },
});

export const getUnreadCount = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return 0;
    
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();
    
    return unreadNotifications.length;
  },
});