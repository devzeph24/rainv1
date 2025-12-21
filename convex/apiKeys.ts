import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Hash an API key for storage (using Web Crypto API)
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate random hex string
 */
function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}


/**
 * Hash an API key (action)
 */
export const hashKeyAction = action({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await hashApiKey(args.key);
  },
});

/**
 * Get API keys by user ID
 */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get active API keys by user ID
 */
export const getActiveByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Verify an API key and return user ID (action - needs async crypto)
 * TODO: Re-enable after types are generated
 */
// export const verifyKey = action({
//   args: { apiKey: v.string() },
//   handler: async (ctx, args) => {
//     const keyHash = await hashApiKey(args.apiKey);
//     const keyRecord = await ctx.runQuery(internal.apiKeys.getByKeyHash, { keyHash });
//     if (!keyRecord || !keyRecord.isActive) return null;
//     if (keyRecord.expiresAt && keyRecord.expiresAt < Date.now()) return null;
//     await ctx.runMutation(internal.apiKeys.updateLastUsed, { keyId: keyRecord._id });
//     return { userId: keyRecord.userId, keyId: keyRecord._id, name: keyRecord.name };
//   },
// });

/**
 * Get API key by hash (query - made internal via export)
 */
export const getByKeyHash = query({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();
  },
});

/**
 * Update last used timestamp (mutation - made internal via export)
 */
export const updateLastUsed = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, {
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Create a new API key for a user (mutation - key generation happens in MCP handler)
 */
export const create = mutation({
  args: {
    userId: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    name: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const keyId = await ctx.db.insert("apiKeys", {
      userId: args.userId,
      keyHash: args.keyHash,
      keyPrefix: args.keyPrefix,
      name: args.name,
      isActive: true,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return {
      keyId,
      keyPrefix: args.keyPrefix,
      name: args.name,
      createdAt: now,
      expiresAt: args.expiresAt,
    };
  },
});

/**
 * Revoke (deactivate) an API key
 */
export const revoke = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const keyRecord = await ctx.db.get(args.keyId);
    if (!keyRecord) {
      throw new Error("API key not found");
    }

    await ctx.db.patch(args.keyId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an API key permanently
 */
export const deleteKey = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.keyId);
    return { success: true };
  },
});

/**
 * List all API keys (admin function)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("apiKeys").collect();
  },
});

