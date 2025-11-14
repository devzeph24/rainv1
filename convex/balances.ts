import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get balance by user ID
 */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userBalances")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Create or update user balance from Rain API data
 */
export const syncFromRain = mutation({
  args: {
    userId: v.string(),
    creditLimit: v.number(),
    outstandingCharges: v.optional(v.number()),
    balancesDue: v.optional(v.number()),
    availableCredit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if balance already exists
    const existing = await ctx.db
      .query("userBalances")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing
      return await ctx.db.patch(existing._id, {
        ...args,
        lastSyncedAt: now,
        updatedAt: now,
      });
    } else {
      // Create new
      return await ctx.db.insert("userBalances", {
        ...args,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * List all balances
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userBalances").collect();
  },
});

