import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const create = mutation({
  args: {
    clerkId: v.string(),
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");

    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: args.content,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
    });

    // Notify all followers about the new post
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    await Promise.all(
      followers.map((follow) =>
        ctx.db.insert("notifications", {
          userId: follow.followerId,
          type: "post",
          actorId: user._id,
          postId: postId,
          read: false,
        })
      )
    );

    return postId;
  },
});

export const update = mutation({
  args: {
    postId: v.id("posts"),
    clerkId: v.string(),
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    const post = await ctx.db.get(args.postId);
    if (!post || post.authorId !== user?._id) throw new Error("Unauthorized");
    await ctx.db.patch(args.postId, { 
      content: args.content,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
    });
  },
});

export const remove = mutation({
  args: { postId: v.id("posts"), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    const post = await ctx.db.get(args.postId);
    if (!post || post.authorId !== user?._id) throw new Error("Unauthorized");
    await ctx.db.delete(args.postId);
  },
});

export const getFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .paginate(paginationOpts);

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const recentPosts = posts.page.filter((p) => now - p._creationTime < oneDayMs);
    const olderPosts = posts.page.filter((p) => now - p._creationTime >= oneDayMs);
    const shuffledOlder = shuffleArray(olderPosts);

    const orderedPosts = [...recentPosts, ...shuffledOlder];

    const postsWithAuthor = await Promise.all(
      orderedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, author };
      })
    );

    return {
      page: postsWithAuthor,
      continueCursor: posts.continueCursor,
      isDone: posts.isDone,
    };
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect(),
});

export const getByAuthorExcluding = query({
  args: { authorId: v.id("users"), excludePostId: v.id("posts"), limit: v.optional(v.number()) },
  handler: async (ctx, { authorId, excludePostId, limit }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .order("desc")
      .filter((q) => q.neq(q.field("_id"), excludePostId))
      .take(limit ?? 6);
    
    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, author };
      })
    );
  },
});

export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;
    const author = await ctx.db.get(post.authorId);
    return { ...post, author, authorId: post.authorId };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const posts = await ctx.db.query("posts").order("desc").take(100);
    const searchLower = query.toLowerCase();
    
    const filteredPosts = posts.filter((post) =>
      post.content?.toLowerCase().includes(searchLower)
    );
    
    return Promise.all(
      filteredPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, author, authorId: post.authorId };
      })
    );
  },
});

export const getVideos = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("mediaType"), "video"))
      .order("desc")
      .take(50);
    
    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, author, authorId: post.authorId };
      })
    );
  },
});
