import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema for Rain Cards API data
 * 
 * This schema stores user applications, cards, contracts, and balances
 * synced from the Rain Cards API.
 */
export default defineSchema({
  // User applications from Rain API
  userApplications: defineTable({
    // Rain API fields
    rainApplicationId: v.string(), // The ID from Rain API
    userId: v.optional(v.string()), // Rain user ID
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
    
    // Address fields
    addressStreet: v.optional(v.string()),
    addressCity: v.optional(v.string()),
    addressState: v.optional(v.string()),
    addressPostalCode: v.optional(v.string()),
    addressCountry: v.optional(v.string()),
    
    phoneCountryCode: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    
    // Links
    applicationCompletionLinkUrl: v.optional(v.string()),
    applicationCompletionLinkParams: v.optional(v.any()),
    applicationExternalVerificationLinkUrl: v.optional(v.string()),
    applicationExternalVerificationLinkParams: v.optional(v.any()),
    
    applicationReason: v.optional(v.string()),
    
    // Metadata
    lastSyncedAt: v.number(), // Timestamp of last sync from Rain API
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rain_application_id", ["rainApplicationId"])
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_status", ["applicationStatus"]),

  // Cards from Rain API
  cards: defineTable({
    // Rain API fields
    rainCardId: v.string(), // The ID from Rain API
    companyId: v.optional(v.string()),
    userId: v.string(), // Rain user ID
    type: v.union(v.literal("physical"), v.literal("virtual")),
    status: v.union(
      v.literal("notActivated"),
      v.literal("activated"),
      v.literal("active"),
      v.literal("locked"),
      v.literal("canceled")
    ),
    
    // Card limits
    limitAmount: v.number(), // Amount in cents
    limitFrequency: v.union(
      v.literal("per24HourPeriod"),
      v.literal("per7DayPeriod"),
      v.literal("per30DayPeriod"),
      v.literal("perYear"),
      v.literal("perYearPeriod"),
      v.literal("allTime"),
      v.literal("perAuthorization")
    ),
    
    // Card details
    last4: v.string(),
    expirationMonth: v.string(),
    expirationYear: v.string(),
    
    // Configuration
    displayName: v.optional(v.string()),
    productId: v.optional(v.string()),
    productRef: v.optional(v.string()),
    virtualCardArt: v.optional(v.string()),
    
    // Billing address
    billingLine1: v.optional(v.string()),
    billingLine2: v.optional(v.string()),
    billingCity: v.optional(v.string()),
    billingRegion: v.optional(v.string()),
    billingPostalCode: v.optional(v.string()),
    billingCountryCode: v.optional(v.string()),
    billingCountry: v.optional(v.string()),
    
    // Token wallets
    tokenWallets: v.optional(v.array(v.string())),
    
    // Metadata
    lastSyncedAt: v.number(), // Timestamp of last sync from Rain API
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rain_card_id", ["rainCardId"])
    .index("by_user_id", ["userId"])
    .index("by_company_id", ["companyId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // User contracts (collateral contracts) from Rain API
  userContracts: defineTable({
    // Rain API fields
    rainContractId: v.string(), // The ID from Rain API
    userId: v.string(), // Rain user ID
    chainId: v.number(),
    controllerAddress: v.optional(v.string()),
    proxyAddress: v.string(),
    programAddress: v.optional(v.string()), // Solana
    depositAddress: v.optional(v.string()),
    contractVersion: v.number(),
    
    // Supported tokens (stored as array of objects)
    tokens: v.array(v.object({
      address: v.string(),
      balance: v.optional(v.string()),
      exchangeRate: v.optional(v.number()),
      advanceRate: v.optional(v.number()),
      symbol: v.optional(v.string()),
      decimals: v.optional(v.number()),
      name: v.optional(v.string()),
    })),
    
    // Onramp information (stored as object)
    onramp: v.optional(v.any()),
    
    // Metadata
    lastSyncedAt: v.number(), // Timestamp of last sync from Rain API
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rain_contract_id", ["rainContractId"])
    .index("by_user_id", ["userId"])
    .index("by_chain_id", ["chainId"])
    .index("by_proxy_address", ["proxyAddress"]),

  // User balances from Rain API
  userBalances: defineTable({
    userId: v.string(), // Rain user ID
    creditLimit: v.number(), // Amount in cents
    outstandingCharges: v.optional(v.number()), // Amount in cents
    balancesDue: v.optional(v.number()), // Amount in cents
    availableCredit: v.optional(v.number()), // Amount in cents
    
    // Metadata
    lastSyncedAt: v.number(), // Timestamp of last sync from Rain API
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"]),

  // Users from Rain API (approved/active users)
  users: defineTable({
    // Rain API fields
    rainUserId: v.string(), // The ID from Rain API
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
    
    // Address fields
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    addressCity: v.optional(v.string()),
    addressRegion: v.optional(v.string()),
    addressPostalCode: v.optional(v.string()),
    addressCountryCode: v.optional(v.string()),
    addressCountry: v.optional(v.string()),
    
    phoneCountryCode: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    
    // Wallet addresses
    walletAddress: v.optional(v.string()), // EVM wallet
    solanaAddress: v.optional(v.string()), // Solana wallet
    
    // Links
    applicationCompletionLinkUrl: v.optional(v.string()),
    applicationCompletionLinkParams: v.optional(v.any()),
    applicationExternalVerificationLinkUrl: v.optional(v.string()),
    applicationExternalVerificationLinkParams: v.optional(v.any()),
    
    applicationReason: v.optional(v.string()),
    
    // Metadata
    lastSyncedAt: v.number(), // Timestamp of last sync from Rain API
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rain_user_id", ["rainUserId"])
    .index("by_company_id", ["companyId"])
    .index("by_email", ["email"])
    .index("by_status", ["applicationStatus"])
    .index("by_is_active", ["isActive"]),
});

