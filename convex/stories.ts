import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Type annotations to resolve circular dependency inference issues
type ActionReturnType = ReturnType<typeof action>;
type InternalMutationReturnType = ReturnType<typeof internalMutation>;
type InternalQueryReturnType = ReturnType<typeof internalQuery>;

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const create = mutation({
  args: {
    clerkId: v.string(),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    privacy: v.union(v.literal("everyone"), v.literal("followers")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const expiresAt = now + TWENTY_FOUR_HOURS_MS;

    const storyId = await ctx.db.insert("stories", {
      authorId: user._id,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      caption: args.caption,
      privacy: args.privacy,
      status: "active",
      expiresAt,
      viewsCount: 0,
      likesCount: 0,
    });

    return storyId;
  },
});

export const remove = mutation({
  args: { storyId: v.id("stories"), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    const story = await ctx.db.get(args.storyId);
    if (!story || story.authorId !== user?._id) throw new Error("Unauthorized");
    await ctx.db.delete(args.storyId);
  },
});

export const archiveExpired: ActionReturnType = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredStories = await ctx.runQuery(internal.stories.getExpiredStories, {
      now,
    });

    for (const story of expiredStories) {
      await ctx.runMutation(internal.stories.archiveStory, { storyId: story._id });
    }

    return { archivedCount: expiredStories.length };
  },
});

export const archiveStory: InternalMutationReturnType = internalMutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, { storyId }) => {
    await ctx.db.patch(storyId, { status: "archived" });
  },
});

export const getExpiredStories: InternalQueryReturnType = internalQuery({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    const allStories = await ctx.db.query("stories").collect();
    return allStories.filter(
      (story) => story.status === "active" && story.expiresAt <= now
    );
  },
});

export const getActiveStories = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return [];

    const now = Date.now();

    // Get all users the current user follows
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();

    const followingIds = new Set(follows.map((f) => f.followingId));
    // Include user's own ID to show their own stories
    followingIds.add(user._id);

    // Get all active stories from followed users
    const allActiveStories = await ctx.db
      .query("stories")
      .filter((q) => q.eq(q.field("status"), "active"))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    const storiesFromFollowing = allActiveStories.filter((story) =>
      followingIds.has(story.authorId)
    );

    // Filter by privacy settings
    const visibleStories: typeof allActiveStories = [];

    for (const story of storiesFromFollowing) {
      // User's own stories are always visible
      if (story.authorId === user._id) {
        visibleStories.push(story);
        continue;
      }

      // Stories with "everyone" privacy from followed users
      if (story.privacy === "everyone") {
        visibleStories.push(story);
        continue;
      }

      // Stories with "followers" privacy - user already follows them
      if (story.privacy === "followers") {
        visibleStories.push(story);
      }
    }

    const storiesWithAuthors = await Promise.all(
      visibleStories.map(async (story) => {
        const author = await ctx.db.get(story.authorId);
        const view = await ctx.db
          .query("storyViews")
          .withIndex("by_user_story", (q) =>
            q.eq("userId", user._id).eq("storyId", story._id)
          )
          .first();
        return { ...story, author, hasViewed: !!view };
      })
    );

    const groupedByAuthor = storiesWithAuthors.reduce((acc, story) => {
      const authorId = story.authorId;
      if (!acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: [],
          hasUnviewed: false,
        };
      }
      acc[authorId].stories.push(story);
      if (!story.hasViewed) {
        acc[authorId].hasUnviewed = true;
      }
      return acc;
    }, {} as Record<string, { author: (typeof storiesWithAuthors)[0]["author"]; stories: typeof storiesWithAuthors; hasUnviewed: boolean }>);

    return Object.values(groupedByAuthor).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });
  },
});

export const getStoriesByUser = query({
  args: { clerkId: v.string(), targetUserId: v.id("users") },
  handler: async (ctx, { clerkId, targetUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return [];

    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) return [];

    const now = Date.now();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status_author", (q) =>
        q.eq("status", "active").eq("authorId", targetUserId)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    const visibleStories: typeof stories = [];

    for (const story of stories) {
      if (story.authorId === user._id) {
        visibleStories.push(story);
        continue;
      }

      if (story.privacy === "everyone") {
        visibleStories.push(story);
        continue;
      }

      if (story.privacy === "followers") {
        const isFollowing = await ctx.db
          .query("follows")
          .withIndex("by_follower_following", (q) =>
            q.eq("followerId", user._id).eq("followingId", story.authorId)
          )
          .first();
        if (isFollowing) {
          visibleStories.push(story);
        }
      }
    }

    return Promise.all(
      visibleStories.map(async (story) => {
        const view = await ctx.db
          .query("storyViews")
          .withIndex("by_user_story", (q) =>
            q.eq("userId", user._id).eq("storyId", story._id)
          )
          .first();
        return { ...story, author: targetUser, hasViewed: !!view };
      })
    );
  },
});

export const getStoriesByUsername = query({
  args: { clerkId: v.string(), username: v.string() },
  handler: async (ctx, { clerkId, username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return [];

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (!targetUser) return [];

    const now = Date.now();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status_author", (q) =>
        q.eq("status", "active").eq("authorId", targetUser._id)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    const visibleStories: typeof stories = [];

    for (const story of stories) {
      if (story.authorId === user._id) {
        visibleStories.push(story);
        continue;
      }

      if (story.privacy === "everyone") {
        visibleStories.push(story);
        continue;
      }

      if (story.privacy === "followers") {
        const isFollowing = await ctx.db
          .query("follows")
          .withIndex("by_follower_following", (q) =>
            q.eq("followerId", user._id).eq("followingId", story.authorId)
          )
          .first();
        if (isFollowing) {
          visibleStories.push(story);
        }
      }
    }

    return Promise.all(
      visibleStories.map(async (story) => {
        const view = await ctx.db
          .query("storyViews")
          .withIndex("by_user_story", (q) =>
            q.eq("userId", user._id).eq("storyId", story._id)
          )
          .first();
        return { ...story, author: targetUser, hasViewed: !!view };
      })
    );
  },
});

export const hasPublicActiveStories = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (!targetUser) return false;

    const now = Date.now();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status_author", (q) =>
        q.eq("status", "active").eq("authorId", targetUser._id)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Check if any story has privacy "everyone"
    return stories.some((story) => story.privacy === "everyone");
  },
});

export const markViewed = mutation({
  args: { clerkId: v.string(), storyId: v.id("stories") },
  handler: async (ctx, { clerkId, storyId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) throw new Error("User not found");

    const story = await ctx.db.get(storyId);
    if (!story) throw new Error("Story not found");

    const existingView = await ctx.db
      .query("storyViews")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", user._id).eq("storyId", storyId)
      )
      .first();

    if (!existingView) {
      await ctx.db.insert("storyViews", {
        storyId,
        userId: user._id,
        viewedAt: Date.now(),
      });
      await ctx.db.patch(storyId, { viewsCount: story.viewsCount + 1 });
    }
  },
});

export const getStoryViewers = query({
  args: { clerkId: v.string(), storyId: v.id("stories") },
  handler: async (ctx, { clerkId, storyId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return [];

    const story = await ctx.db.get(storyId);
    if (!story || story.authorId !== user._id) throw new Error("Unauthorized");

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", storyId))
      .order("desc")
      .collect();

    return Promise.all(
      views.map(async (view) => {
        const viewer = await ctx.db.get(view.userId);
        return { ...view, viewer };
      })
    );
  },
});

export const getMyArchivedStories = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return [];

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status_author", (q) =>
        q.eq("status", "archived").eq("authorId", user._id)
      )
      .order("desc")
      .collect();

    return Promise.all(
      stories.map(async (story) => {
        const views = await ctx.db
          .query("storyViews")
          .withIndex("by_story", (q) => q.eq("storyId", story._id))
          .collect();
        return { ...story, viewCount: views.length };
      })
    );
  },
});

export const getMyStories = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return [];

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      stories.map(async (story) => {
        const views = await ctx.db
          .query("storyViews")
          .withIndex("by_story", (q) => q.eq("storyId", story._id))
          .collect();
        const likes = await ctx.db
          .query("storyLikes")
          .withIndex("by_story", (q) => q.eq("storyId", story._id))
          .collect();
        return { ...story, viewCount: views.length, likeCount: likes.length };
      })
    );
  },
});

// ── Likes ──────────────────────────────────────────────

export const toggleLike = mutation({
  args: { clerkId: v.string(), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");

    const existing = await ctx.db
      .query("storyLikes")
      .withIndex("by_story_user", (q) =>
        q.eq("storyId", args.storyId).eq("userId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.storyId, { likesCount: Math.max(0, (story.likesCount ?? 0) - 1) });
      return false;
    } else {
      await ctx.db.insert("storyLikes", {
        storyId: args.storyId,
        userId: user._id,
        likedAt: Date.now(),
      });
      await ctx.db.patch(args.storyId, { likesCount: (story.likesCount ?? 0) + 1 });
      return true;
    }
  },
});

export const isLiked = query({
  args: { clerkId: v.string(), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return false;

    const like = await ctx.db
      .query("storyLikes")
      .withIndex("by_story_user", (q) =>
        q.eq("storyId", args.storyId).eq("userId", user._id)
      )
      .first();

    return !!like;
  },
});

export const getStoryLikers = query({
  args: { clerkId: v.string(), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return [];

    const story = await ctx.db.get(args.storyId);
    if (!story || story.authorId !== user._id) throw new Error("Unauthorized");

    const likes = await ctx.db
      .query("storyLikes")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .collect();

    return Promise.all(
      likes.map(async (like) => {
        const liker = await ctx.db.get(like.userId);
        return { ...like, liker };
      })
    );
  },
});
