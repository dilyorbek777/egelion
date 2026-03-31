import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertFromClerk = mutation({
  args: { clerkId: v.string(), email: v.string() },
  handler: async (ctx, { clerkId, email }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!existing) {
      await ctx.db.insert("users", {
        clerkId,
        username: "",
        fullName: "",
        isProfileComplete: false,
      });
    }
  },
});

export const completeProfile = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    fullName: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // Create user if they don't exist
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        username: "",
        fullName: "",
        isProfileComplete: false,
      });
      user = await ctx.db.get(userId);
    }

    if (!user) throw new Error("Failed to create user");

    // Check username uniqueness
    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (taken && taken._id !== user._id) throw new Error("Username taken");

    await ctx.db.patch(user._id, {
      username: args.username,
      fullName: args.fullName,
      profileImage: args.profileImage,
      isProfileComplete: true,
    });
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) =>
    ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first(),
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) =>
    ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first(),
});

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    fullName: v.optional(v.string()),
    bio: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) throw new Error("User not found");

    // Validate username if provided and changed
    const newUsername = args.username?.trim();
    if (newUsername && newUsername !== user.username) {
      // Format validation: 3-20 chars, alphanumeric + underscore only
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(newUsername)) {
        throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores");
      }
      
      // Check uniqueness
      const taken = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", newUsername))
        .first();
      if (taken) {
        throw new Error("Username is already taken");
      }
    }

    const updateData: any = {};
    if (args.fullName !== undefined) updateData.fullName = args.fullName;
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.profileImage !== undefined) updateData.profileImage = args.profileImage;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.website !== undefined) updateData.website = args.website;
    if (newUsername && newUsername !== user.username) updateData.username = newUsername;

    await ctx.db.patch(user._id, updateData);
    return await ctx.db.get(user._id);
  },
});

export const checkUsernameAvailability = query({
  args: { usernames: v.array(v.string()) },
  handler: async (ctx, { usernames }) => {
    const availability = await Promise.all(
      usernames.map(async (username) => {
        const existing = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", username))
          .first();
        return { username, available: !existing };
      })
    );
    return availability;
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const users = await ctx.db.query("users").take(100);
    const searchLower = query.toLowerCase();
    
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchLower) ||
        user.fullName.toLowerCase().includes(searchLower)
    );
  },
});

