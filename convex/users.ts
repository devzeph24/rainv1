import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a user by Rain user ID
 */
export const getByRainId = query({
  args: { rainUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_rain_user_id", (q) => q.eq("rainUserId", args.rainUserId))
      .first();
  },
});

/**
 * Get users by company ID
 */
export const getByCompanyId = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

/**
 * Get users by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
  },
});

/**
 * Get users by status
 */
export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("notStarted"),
      v.literal("approved"),
      v.literal("pending"),
      v.literal("needsInformation"),
      v.literal("needsVerification"),
      v.literal("manualReview"),
      v.literal("denied"),
      v.literal("locked"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("applicationStatus", args.status))
      .collect();
  },
});

/**
 * Get active users
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_is_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * Create or update a user from Rain API data
 */
export const syncFromRain = mutation({
  args: {
    rainUserId: v.string(),
    companyId: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    isActive: v.boolean(),
    isTermsOfServiceAccepted: v.boolean(),
    applicationStatus: v.union(
      v.literal("notStarted"),
      v.literal("approved"),
      v.literal("pending"),
      v.literal("needsInformation"),
      v.literal("needsVerification"),
      v.literal("manualReview"),
      v.literal("denied"),
      v.literal("locked"),
      v.literal("canceled")
    ),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    addressCity: v.optional(v.string()),
    addressRegion: v.optional(v.string()),
    addressPostalCode: v.optional(v.string()),
    addressCountryCode: v.optional(v.string()),
    addressCountry: v.optional(v.string()),
    phoneCountryCode: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    solanaAddress: v.optional(v.string()),
    applicationCompletionLinkUrl: v.optional(v.string()),
    applicationCompletionLinkParams: v.optional(v.any()),
    applicationExternalVerificationLinkUrl: v.optional(v.string()),
    applicationExternalVerificationLinkParams: v.optional(v.any()),
    applicationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_rain_user_id", (q) => q.eq("rainUserId", args.rainUserId))
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
      return await ctx.db.insert("users", {
        ...args,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * List all users
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

