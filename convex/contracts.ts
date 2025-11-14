import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a contract by Rain contract ID
 */
export const getByRainId = query({
  args: { rainContractId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userContracts")
      .withIndex("by_rain_contract_id", (q) =>
        q.eq("rainContractId", args.rainContractId)
      )
      .first();
  },
});

/**
 * Get contracts by user ID
 */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userContracts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get contracts by chain ID
 */
export const getByChainId = query({
  args: { chainId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userContracts")
      .withIndex("by_chain_id", (q) => q.eq("chainId", args.chainId))
      .collect();
  },
});

/**
 * Get contract by proxy address
 */
export const getByProxyAddress = query({
  args: { proxyAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userContracts")
      .withIndex("by_proxy_address", (q) =>
        q.eq("proxyAddress", args.proxyAddress)
      )
      .first();
  },
});

/**
 * Create or update a contract from Rain API data
 */
export const syncFromRain = mutation({
  args: {
    rainContractId: v.string(),
    userId: v.string(),
    chainId: v.number(),
    controllerAddress: v.optional(v.string()),
    proxyAddress: v.string(),
    programAddress: v.optional(v.string()),
    depositAddress: v.optional(v.string()),
    contractVersion: v.number(),
    tokens: v.array(
      v.object({
        address: v.string(),
        balance: v.optional(v.string()),
        exchangeRate: v.optional(v.number()),
        advanceRate: v.optional(v.number()),
        symbol: v.optional(v.string()),
        decimals: v.optional(v.number()),
        name: v.optional(v.string()),
      })
    ),
    onramp: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if contract already exists
    const existing = await ctx.db
      .query("userContracts")
      .withIndex("by_rain_contract_id", (q) =>
        q.eq("rainContractId", args.rainContractId)
      )
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
      return await ctx.db.insert("userContracts", {
        ...args,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * List all contracts
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userContracts").collect();
  },
});

