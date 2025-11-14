import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a card by Rain card ID
 */
export const getByRainId = query({
  args: { rainCardId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_rain_card_id", (q) => q.eq("rainCardId", args.rainCardId))
      .first();
  },
});

/**
 * Get cards by user ID
 */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get cards by company ID
 */
export const getByCompanyId = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

/**
 * Get cards by status
 */
export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("notActivated"),
      v.literal("activated"),
      v.literal("active"),
      v.literal("locked"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

/**
 * Get cards by type
 */
export const getByType = query({
  args: { type: v.union(v.literal("physical"), v.literal("virtual")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

/**
 * Create or update a card from Rain API data
 */
export const syncFromRain = mutation({
  args: {
    rainCardId: v.string(),
    companyId: v.optional(v.string()),
    userId: v.string(),
    type: v.union(v.literal("physical"), v.literal("virtual")),
    status: v.union(
      v.literal("notActivated"),
      v.literal("activated"),
      v.literal("active"),
      v.literal("locked"),
      v.literal("canceled")
    ),
    limitAmount: v.number(),
    limitFrequency: v.union(
      v.literal("per24HourPeriod"),
      v.literal("per7DayPeriod"),
      v.literal("per30DayPeriod"),
      v.literal("perYear"),
      v.literal("perYearPeriod"),
      v.literal("allTime"),
      v.literal("perAuthorization")
    ),
    last4: v.string(),
    expirationMonth: v.string(),
    expirationYear: v.string(),
    displayName: v.optional(v.string()),
    productId: v.optional(v.string()),
    productRef: v.optional(v.string()),
    virtualCardArt: v.optional(v.string()),
    billingLine1: v.optional(v.string()),
    billingLine2: v.optional(v.string()),
    billingCity: v.optional(v.string()),
    billingRegion: v.optional(v.string()),
    billingPostalCode: v.optional(v.string()),
    billingCountryCode: v.optional(v.string()),
    billingCountry: v.optional(v.string()),
    tokenWallets: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if card already exists
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_rain_card_id", (q) => q.eq("rainCardId", args.rainCardId))
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
      return await ctx.db.insert("cards", {
        ...args,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Update card status
 */
export const updateStatus = mutation({
  args: {
    rainCardId: v.string(),
    status: v.union(
      v.literal("notActivated"),
      v.literal("activated"),
      v.literal("active"),
      v.literal("locked"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("cards")
      .withIndex("by_rain_card_id", (q) => q.eq("rainCardId", args.rainCardId))
      .first();

    if (!card) {
      throw new Error(`Card not found: ${args.rainCardId}`);
    }

    return await ctx.db.patch(card._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update card limit
 */
export const updateLimit = mutation({
  args: {
    rainCardId: v.string(),
    limitAmount: v.number(),
    limitFrequency: v.union(
      v.literal("per24HourPeriod"),
      v.literal("per7DayPeriod"),
      v.literal("per30DayPeriod"),
      v.literal("perYear"),
      v.literal("perYearPeriod"),
      v.literal("allTime"),
      v.literal("perAuthorization")
    ),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("cards")
      .withIndex("by_rain_card_id", (q) => q.eq("rainCardId", args.rainCardId))
      .first();

    if (!card) {
      throw new Error(`Card not found: ${args.rainCardId}`);
    }

    return await ctx.db.patch(card._id, {
      limitAmount: args.limitAmount,
      limitFrequency: args.limitFrequency,
      updatedAt: Date.now(),
    });
  },
});

/**
 * List all cards
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cards").collect();
  },
});

