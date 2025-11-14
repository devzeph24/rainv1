import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a user application by Rain application ID
 */
export const getByRainId = query({
  args: { rainApplicationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userApplications")
      .withIndex("by_rain_application_id", (q) =>
        q.eq("rainApplicationId", args.rainApplicationId)
      )
      .first();
  },
});

/**
 * Get user applications by user ID
 */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userApplications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get user applications by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userApplications")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
  },
});

/**
 * Get user applications by status
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
      .query("userApplications")
      .withIndex("by_status", (q) => q.eq("applicationStatus", args.status))
      .collect();
  },
});

/**
 * Create or update a user application from Rain API data
 */
export const syncFromRain = mutation({
  args: {
    rainApplicationId: v.string(),
    userId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isTermsOfServiceAccepted: v.optional(v.boolean()),
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
    companyId: v.optional(v.string()),
    addressStreet: v.optional(v.string()),
    addressCity: v.optional(v.string()),
    addressState: v.optional(v.string()),
    addressPostalCode: v.optional(v.string()),
    addressCountry: v.optional(v.string()),
    phoneCountryCode: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    applicationCompletionLinkUrl: v.optional(v.string()),
    applicationCompletionLinkParams: v.optional(v.any()),
    applicationExternalVerificationLinkUrl: v.optional(v.string()),
    applicationExternalVerificationLinkParams: v.optional(v.any()),
    applicationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if application already exists
    const existing = await ctx.db
      .query("userApplications")
      .withIndex("by_rain_application_id", (q) =>
        q.eq("rainApplicationId", args.rainApplicationId)
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
      return await ctx.db.insert("userApplications", {
        ...args,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * List all user applications
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userApplications").collect();
  },
});

