import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    isPublic: v.boolean(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use the provided clerk user ID from frontend
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();
    
    if (!user) {
      // Create user if doesn't exist
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkUserId,
        username: "user_" + args.clerkUserId.slice(-8),
        fullName: "New User",
        isProfileComplete: false,
        isAdmin: false,
      });
      user = await ctx.db.get(userId);
    }

    // TypeScript: ensure user is defined
    if (!user) {
      throw new Error("Unable to create or find user");
    }

    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      authorId: user!._id,
      title: args.title,
      content: args.content,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});

export const getDocuments = query({
  args: {
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user;
    
    if (args.clerkUserId) {
      // Use the provided clerk user ID from frontend
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId!))
        .first();
    } else {
      // No user provided, return only public documents
      const publicDocs = await ctx.db
        .query("documents")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();

      // Sort by updatedAt descending
      publicDocs.sort((a, b) => b.updatedAt - a.updatedAt);

      // Get author information for each document
      const documentsWithAuthors = await Promise.all(
        publicDocs.map(async (doc) => {
          const author = await ctx.db.get(doc.authorId);
          return {
            ...doc,
            author,
          };
        })
      );

      return documentsWithAuthors;
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Get all public documents and user's private documents
    const publicDocs = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
    
    const privateDocs = await ctx.db
      .query("documents")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .filter((q) => q.eq(q.field("isPublic"), false))
      .collect();

    const documents = [...publicDocs, ...privateDocs];

    // Sort by updatedAt descending
    documents.sort((a, b) => b.updatedAt - a.updatedAt);

    // Get author information for each document
    const documentsWithAuthors = await Promise.all(
      documents.map(async (doc) => {
        const author = await ctx.db.get(doc.authorId);
        return {
          ...doc,
          author,
        };
      })
    );

    return documentsWithAuthors;
  },
});

export const getDocument = query({
  args: {
    documentId: v.id("documents"),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // If document is public, allow access to anyone
    if (document.isPublic) {
      const author = await ctx.db.get(document.authorId);
      return {
        ...document,
        author,
      };
    }

    // For private documents, check user access
    if (args.clerkUserId) {
      // Use the provided clerk user ID from frontend
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId!))
        .first();

      if (!user) {
        throw new Error("User not found");
      }

      // Check if user has access to this private document
      if (document.authorId !== user._id) {
        throw new Error("Access denied");
      }

      const author = await ctx.db.get(document.authorId);

      return {
        ...document,
        author,
      };
    } else {
      // No user provided, deny access to private documents
      throw new Error("Authentication required to access private documents");
    }
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use the provided clerk user ID from frontend
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user is the author
    if (document.authorId !== user._id) {
      throw new Error("Access denied");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updateData.title = args.title;
    }
    if (args.content !== undefined) {
      updateData.content = args.content;
    }
    if (args.isPublic !== undefined) {
      updateData.isPublic = args.isPublic;
    }

    await ctx.db.patch(args.documentId, updateData);

    return args.documentId;
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use the provided clerk user ID from frontend
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user is the author
    if (document.authorId !== user._id) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.documentId);

    return args.documentId;
  },
});
