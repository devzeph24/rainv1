import { z } from 'zod';
import { createMcpHandler, protectedResourceHandler, metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import crypto from 'crypto';
import {
  createCard,
  getCardSecrets,
  getUserBalances,
  TEST_CARD,
  initiateUserApplication,
  getUserContracts,
  createUserContract,
  getCard,
} from '@/lib/rain-api';
import { generateSessionIdForEnv } from '@/lib/session-id';
import { decryptSecret } from '@/lib/card-decrypt';

const USE_TEST_CARDS = process.env.USE_TEST_CARDS === 'true' || process.env.USE_TEST_CARDS === '1';
const MCP_API_KEY = process.env.MCP_API_KEY;

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is not defined');
}

const client = new ConvexHttpClient(convexUrl);

function authenticateRequest(request: Request): void {
  if (!MCP_API_KEY) {
    return;
  }
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '') ||
                 request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== MCP_API_KEY) {
    throw new Error('Unauthorized: Invalid or missing API key');
  }
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'get_user_balance',
      'Get balance and credit limit information for a user. Fetches fresh data from Rain API. Use this to check available credit before creating a card.',
      {
        userId: z.string().describe('The Rain user ID'),
      },
      async ({ userId }) => {
        try {
          const balance = await getUserBalances(userId);
          const totalCharges =
            (balance.pendingCharges ?? 0) + (balance.postedCharges ?? 0);
          const availableCredit =
            balance.spendingPower ??
            balance.availableCredit ??
            (balance.creditLimit - totalCharges);
          try {
            await client.mutation(api.balances.syncFromRain, {
              userId,
              creditLimit: balance.creditLimit,
              outstandingCharges:
                balance.outstandingCharges ?? totalCharges,
              balancesDue: balance.balancesDue ?? balance.balanceDue,
              availableCredit,
            });
          } catch (syncError) {
            console.error('Failed to sync balance to Convex:', syncError);
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    userId,
                    creditLimit: balance.creditLimit,
                    availableCredit,
                    pendingCharges: balance.pendingCharges ?? 0,
                    postedCharges: balance.postedCharges ?? 0,
                    totalCharges: totalCharges,
                    balanceDue: balance.balanceDue ?? 0,
                    spendingPower: balance.spendingPower,
                    creditLimitDollars: (balance.creditLimit / 100).toFixed(2),
                    availableCreditDollars: (availableCredit / 100).toFixed(2),
                    source: 'Rain API (fresh data)',
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}` },
            ],
          };
        }
      },
    );

    server.tool(
      'create_virtual_card',
      'Create a virtual card for a user with specified spending limits. Use this when an agent needs to make a purchase.',
      {
        userId: z.string().describe('The Rain user ID'),
        limitAmount: z.number().int().min(1).describe('Spending limit amount in cents (e.g., 10000 = $100.00)'),
        limitFrequency: z
          .enum(['per24HourPeriod', 'per7DayPeriod', 'per30DayPeriod', 'perYearPeriod', 'allTime', 'perAuthorization'])
          .default('perAuthorization')
          .describe('How often the limit applies'),
        displayName: z.string().optional().describe('Optional display name for the card'),
        status: z.enum(['notActivated', 'active']).default('active').describe('Initial card status'),
      },
      async ({ userId, limitAmount, limitFrequency, displayName, status }) => {
        try {
          const card = await createCard(userId, {
            type: 'virtual',
            status,
            limit: { amount: limitAmount, frequency: limitFrequency },
            configuration: displayName ? { displayName } : undefined,
          });
          await client.mutation(api.cards.syncFromRain, {
            rainCardId: card.id,
            companyId: card.companyId,
            userId: card.userId,
            type: card.type,
            status: card.status,
            limitAmount: card.limit.amount,
            limitFrequency: card.limit.frequency,
            last4: card.last4,
            expirationMonth: card.expirationMonth,
            expirationYear: card.expirationYear,
            tokenWallets: card.tokenWallets,
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cardId: card.id,
                    last4: card.last4,
                    type: card.type,
                    status: card.status,
                    limit: {
                      amount: card.limit.amount,
                      amountDollars: (card.limit.amount / 100).toFixed(2),
                      frequency: card.limit.frequency,
                    },
                    expirationMonth: card.expirationMonth,
                    expirationYear: card.expirationYear,
                    message: USE_TEST_CARDS
                      ? 'Test card created successfully. Use get_card_payment_details to retrieve test PAN and CVC.'
                      : 'Card created successfully. Use get_card_payment_details to retrieve PAN and CVC.',
                    testMode: USE_TEST_CARDS,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error creating card: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'get_card_payment_details',
      'Get the card number (PAN) and CVC for a card. Use this to complete a purchase. WARNING: Only request when ready to make payment.',
      {
        cardId: z.string().describe('The Rain card ID'),
        userId: z.string().describe('The Rain user ID (required for session generation)'),
      },
      async ({ cardId, userId }) => {
        try {
          const sessionData = generateSessionIdForEnv(
            process.env.RAIN_API_BASE_URL?.includes('api.raincards.xyz') ?? false,
          );
          void userId;
          const secrets = await getCardSecrets(cardId, sessionData.sessionId);
          const pan = decryptSecret(secrets.encryptedPan.data, secrets.encryptedPan.iv, sessionData.secretKey);
          const cvc = decryptSecret(secrets.encryptedCvc.data, secrets.encryptedCvc.iv, sessionData.secretKey);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cardId,
                    pan,
                    cvc,
                    billingAddress: USE_TEST_CARDS ? TEST_CARD.billingAddress : undefined,
                    testMode: USE_TEST_CARDS,
                    warning: USE_TEST_CARDS
                      ? 'TEST MODE: Using test card details. This card will always be returned in test mode.'
                      : 'Keep this information secure. Only use for the intended purchase.',
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error fetching card details: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'get_user_cards',
      'Get all cards for a user. Use this to see existing cards before creating a new one.',
      { userId: z.string().describe('The Rain user ID') },
      async ({ userId }) => {
        try {
          const cards = await client.query(api.cards.getByUserId, { userId });
          if (cards.length === 0) {
            return { content: [{ type: 'text', text: `No cards found for user ${userId}` }] };
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  cards.map((card) => ({
                    cardId: card.rainCardId,
                    last4: card.last4,
                    type: card.type,
                    status: card.status,
                    limit: {
                      amount: card.limitAmount,
                      amountDollars: (card.limitAmount / 100).toFixed(2),
                      frequency: card.limitFrequency,
                    },
                    expirationMonth: card.expirationMonth,
                    expirationYear: card.expirationYear,
                    createdAt: new Date(card.createdAt).toISOString(),
                  })),
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error fetching cards: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'get_card_details',
      'Get detailed information about a specific card including status and limits.',
      { cardId: z.string().describe('The Rain card ID') },
      async ({ cardId }) => {
        try {
          const card = await client.query(api.cards.getByRainId, { rainCardId: cardId });
          if (!card) {
            return { content: [{ type: 'text', text: `Card with ID ${cardId} not found in database.` }] };
          }
          return {
            content: [
              { type: 'text', text: JSON.stringify({
                cardId: card.rainCardId,
                userId: card.userId,
                last4: card.last4,
                type: card.type,
                status: card.status,
                limit: {
                  amount: card.limitAmount,
                  amountDollars: (card.limitAmount / 100).toFixed(2),
                  frequency: card.limitFrequency,
                },
                expirationMonth: card.expirationMonth,
                expirationYear: card.expirationYear,
                createdAt: new Date(card.createdAt).toISOString(),
                updatedAt: new Date(card.updatedAt).toISOString(),
              }, null, 2) },
            ],
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error fetching card: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'update_card_status',
      'Update a card status. Use "locked" to secure a card after purchase, "active" to unlock it, or "canceled" to permanently disable it.',
      { cardId: z.string().describe('The Rain card ID'), status: z.enum(['notActivated', 'active', 'locked', 'canceled']).describe('New card status') },
      async ({ cardId, status }) => {
        try {
          const { updateCard } = await import('@/lib/rain-api');
          const updatedCard = await updateCard(cardId, { status });
          await client.mutation(api.cards.updateStatus, { rainCardId: cardId, status: updatedCard.status });
          return { content: [{ type: 'text', text: JSON.stringify({ cardId: updatedCard.id, status: updatedCard.status, message: `Card status updated to ${status}` }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error updating card status: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'update_card_limit',
      'Update the spending limit for a card. Use this if the purchase amount changes or you need to adjust limits.',
      {
        cardId: z.string().describe('The Rain card ID'),
        limitAmount: z.number().int().min(1).describe('New spending limit amount in cents'),
        limitFrequency: z.enum(['per24HourPeriod', 'per7DayPeriod', 'per30DayPeriod', 'perYearPeriod', 'allTime', 'perAuthorization']).describe('How often the limit applies'),
      },
      async ({ cardId, limitAmount, limitFrequency }) => {
        try {
          const { updateCard } = await import('@/lib/rain-api');
          const updatedCard = await updateCard(cardId, { limit: { amount: limitAmount, frequency: limitFrequency } });
          await client.mutation(api.cards.updateLimit, { rainCardId: cardId, limitAmount: updatedCard.limit.amount, limitFrequency: updatedCard.limit.frequency });
          return { content: [{ type: 'text', text: JSON.stringify({ cardId: updatedCard.id, limit: { amount: updatedCard.limit.amount, amountDollars: (updatedCard.limit.amount / 100).toFixed(2), frequency: updatedCard.limit.frequency }, message: 'Card limit updated successfully' }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error updating card limit: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'initiate_user_application',
      'Create a new user application. This is the first step in onboarding a new user. Returns application details and completion links.',
      { firstName: z.string().min(1).max(50), lastName: z.string().min(1).max(50), email: z.string().email(), walletAddress: z.string().optional() },
      async ({ firstName, lastName, email, walletAddress }) => {
        try {
          const application = await initiateUserApplication({ firstName, lastName, email, walletAddress });
          return { content: [{ type: 'text', text: JSON.stringify({
            applicationId: application.id,
            userId: application.id,
            firstName: application.firstName,
            lastName: application.lastName,
            email: application.email,
            applicationStatus: application.applicationStatus,
            isActive: application.isActive,
            applicationCompletionLink: application.applicationCompletionLink,
            applicationExternalVerificationLink: application.applicationExternalVerificationLink,
            message: application.applicationStatus === 'approved' ? 'User application approved. You can now create cards.' : 'User application created. Follow the completion link to finish setup.',
          }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error initiating application: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'get_user_by_id',
      'Get user details by Rain user ID from the database. Use this to look up user information.',
      { userId: z.string().describe('The Rain user ID') },
      async ({ userId }) => {
        try {
          const user = await client.query(api.users.getByRainId, { rainUserId: userId });
          if (!user) {
            return { content: [{ type: 'text', text: `User with ID ${userId} not found.` }] };
          }
          return { content: [{ type: 'text', text: JSON.stringify({
            userId: user.rainUserId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive,
            applicationStatus: user.applicationStatus,
            walletAddress: user.walletAddress ?? undefined,
            address: user.addressLine1
              ? {
                  street1: user.addressLine1,
                  street2: user.addressLine2 ?? undefined,
                  city: user.addressCity,
                  region: user.addressRegion,
                  postalCode: user.addressPostalCode,
                  country: user.addressCountry,
                }
              : undefined,
            lastSyncedAt: new Date(user.lastSyncedAt).toISOString(),
          }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error fetching user: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'get_user_by_email',
      'Find user(s) by email address. Returns all users with matching email.',
      { email: z.string().email().describe('User email address') },
      async ({ email }) => {
        try {
          const users = await client.query(api.users.getByEmail, { email });
          if (users.length === 0) {
            return { content: [{ type: 'text', text: `No users found with email ${email}` }] };
          }
          return { content: [{ type: 'text', text: JSON.stringify(users.map((user) => ({ userId: user.rainUserId, firstName: user.firstName, lastName: user.lastName, email: user.email, isActive: user.isActive, applicationStatus: user.applicationStatus })), null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error fetching users: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'list_users',
      'List all users in the database. Use cursor and limit for pagination.',
      {
        limit: z.number().int().min(1).max(100).optional().describe('Maximum number of users to return (default: 50)'),
        status: z
          .enum(['notStarted','approved','pending','needsInformation','needsVerification','manualReview','denied','locked','canceled'])
          .optional()
          .describe('Filter by application status'),
      },
      async ({ limit = 50, status }) => {
        try {
          const users = status ? await client.query(api.users.getByStatus, { status }) : await client.query(api.users.list, {});
          const limitedUsers = users.slice(0, limit);
          return { content: [{ type: 'text', text: JSON.stringify({
            total: users.length,
            returned: limitedUsers.length,
            users: limitedUsers.map((user) => ({ userId: user.rainUserId, firstName: user.firstName, lastName: user.lastName, email: user.email, isActive: user.isActive, applicationStatus: user.applicationStatus })),
          }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error listing users: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'get_user_contracts',
      'Get all collateral contracts for a user. These contracts hold the collateral that backs the user credit.',
      { userId: z.string().describe('The Rain user ID') },
      async ({ userId }) => {
        try {
          const contracts = await getUserContracts(userId);
          if (contracts.length === 0) {
            return { content: [{ type: 'text', text: `No contracts found for user ${userId}. Use create_user_contract to create one.` }] };
          }
          return { content: [{ type: 'text', text: JSON.stringify(contracts.map((contract) => ({
            contractId: contract.id,
            chainId: contract.chainId,
            proxyAddress: contract.proxyAddress,
            controllerAddress: contract.controllerAddress,
            depositAddress: contract.depositAddress,
            programAddress: contract.programAddress,
            contractVersion: contract.contractVersion,
            tokens: contract.tokens.map((token) => ({ address: token.address, symbol: token.symbol, name: token.name, balance: token.balance, exchangeRate: token.exchangeRate, advanceRate: token.advanceRate })),
            onramp: contract.onramp,
          })), null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error fetching contracts: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'create_user_contract',
      'Create a collateral contract for a user on a specific blockchain. The user must have a wallet address set.',
      { userId: z.string().describe('The Rain user ID'), chainId: z.number().int().describe('Blockchain chain ID (e.g., 1 for Ethereum, 137 for Polygon)') },
      async ({ userId, chainId }) => {
        try {
          const contract = await createUserContract(userId, chainId);
          return { content: [{ type: 'text', text: JSON.stringify({
            contractId: contract.id,
            chainId: contract.chainId,
            proxyAddress: contract.proxyAddress,
            controllerAddress: contract.controllerAddress,
            depositAddress: contract.depositAddress,
            programAddress: contract.programAddress,
            contractVersion: contract.contractVersion,
            tokens: contract.tokens.map((token) => ({ address: token.address, symbol: token.symbol, name: token.name })),
            message: 'Contract created successfully. User can now deposit collateral.',
          }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error creating contract: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'get_card_from_rain',
      'Get fresh card data directly from Rain API. Use this when you need the most up-to-date card information.',
      { cardId: z.string().describe('The Rain card ID') },
      async ({ cardId }) => {
        try {
          const card = await getCard(cardId);
          return { content: [{ type: 'text', text: JSON.stringify({
            cardId: card.id,
            userId: card.userId,
            companyId: card.companyId,
            type: card.type,
            status: card.status,
            last4: card.last4,
            expirationMonth: card.expirationMonth,
            expirationYear: card.expirationYear,
            limit: { amount: card.limit.amount, amountDollars: (card.limit.amount / 100).toFixed(2), frequency: card.limit.frequency },
            tokenWallets: card.tokenWallets,
            source: 'Rain API (fresh data)',
          }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error fetching card: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'list_all_cards',
      'List all cards in the database. Use this to browse all cards across all users.',
      {
        limit: z.number().int().min(1).max(100).optional().describe('Maximum number of cards to return (default: 50)'),
        status: z.enum(['notActivated', 'active', 'locked', 'canceled']).optional().describe('Filter by card status'),
        type: z.enum(['virtual', 'physical']).optional().describe('Filter by card type'),
      },
      async ({ limit = 50, status, type }) => {
        try {
          let cards;
          if (status) {
            cards = await client.query(api.cards.getByStatus, { status });
          } else if (type) {
            cards = await client.query(api.cards.getByType, { type });
          } else {
            cards = await client.query(api.cards.list, {});
          }
          const limitedCards = cards.slice(0, limit);
          return { content: [{ type: 'text', text: JSON.stringify({
            total: cards.length,
            returned: limitedCards.length,
            cards: limitedCards.map((card) => ({
              cardId: card.rainCardId,
              userId: card.userId,
              type: card.type,
              status: card.status,
              last4: card.last4,
              limit: { amount: card.limitAmount, amountDollars: (card.limitAmount / 100).toFixed(2), frequency: card.limitFrequency },
              expirationMonth: card.expirationMonth,
              expirationYear: card.expirationYear,
              createdAt: new Date(card.createdAt).toISOString(),
            })),
          }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error listing cards: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'generate_api_key',
      'Generate a new API key for a user. The key will be shown once - save it securely. Returns the full key that can be used for MCP authentication.',
      { userId: z.string().describe('The Rain user ID'), name: z.string().optional(), expiresInDays: z.number().int().min(1).optional() },
      async ({ userId, name, expiresInDays }) => {
        try {
          const expiresAt = expiresInDays ? Date.now() + expiresInDays * 24 * 60 * 60 * 1000 : undefined;
          const randomBytes = crypto.randomBytes(16).toString('hex');
          const key = `led_${randomBytes}`;
          const keyPrefix = key.substring(0, 12);
          const keyHash = crypto.createHash('sha256').update(key).digest('hex');
          const result = await client.mutation(api.apiKeys.create, { userId, keyHash, keyPrefix, name, expiresAt });
          return { content: [{ type: 'text', text: JSON.stringify({
            keyId: result.keyId,
            apiKey: key,
            keyPrefix: result.keyPrefix,
            name: result.name,
            createdAt: new Date(result.createdAt).toISOString(),
            expiresAt: result.expiresAt ? new Date(result.expiresAt).toISOString() : null,
            warning: '⚠️ Save this API key securely! It will not be shown again. Use it with: Authorization: Bearer <key> or X-API-Key: <key>',
          }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error generating API key: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'list_api_keys',
      'List all API keys for a user. Only shows key prefixes, not full keys.',
      { userId: z.string().describe('The Rain user ID'), includeInactive: z.boolean().default(false).describe('Include revoked/inactive keys') },
      async ({ userId, includeInactive }) => {
        try {
          const keys = includeInactive ? await client.query(api.apiKeys.getByUserId, { userId }) : await client.query(api.apiKeys.getActiveByUserId, { userId });
          if (keys.length === 0) {
            return { content: [{ type: 'text', text: `No API keys found for user ${userId}` }] };
          }
          return { content: [{ type: 'text', text: JSON.stringify(keys.map((key) => ({
            keyId: key._id,
            keyPrefix: key.keyPrefix,
            name: key.name,
            isActive: key.isActive,
            lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt).toISOString() : null,
            expiresAt: key.expiresAt ? new Date(key.expiresAt).toISOString() : null,
            createdAt: new Date(key.createdAt).toISOString(),
          })), null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error listing API keys: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );

    server.tool(
      'revoke_api_key',
      'Revoke (deactivate) an API key. The key will no longer work for authentication.',
      { keyId: z.string().describe('The API key ID (from list_api_keys)') },
      async ({ keyId }) => {
        try {
          await client.mutation(api.apiKeys.revoke, { keyId: keyId as Id<'apiKeys'> });
          return { content: [{ type: 'text', text: JSON.stringify({ keyId, message: 'API key revoked successfully' }, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error revoking API key: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      },
    );
  },
  {},
  {
    disableSse: true,
    basePath: '',
    verboseLogs: process.env.NODE_ENV === 'development',
    // To enable SSE on Vercel later, set disableSse: false and configure REDIS_URL
    // redisUrl: process.env.REDIS_URL,
  },
);

async function authenticatedHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'GET') {
      if (path.endsWith('/.well-known/openid-configuration') || path.includes('/.well-known/openid-configuration')) {
        const origin = url.origin;
        const base = path.includes('/api/mcp')
          ? '/api/mcp'
          : path.includes('/mcp')
          ? '/mcp'
          : '/api/mcp';
        const issuer = `${origin}${base}`;
        const body = {
          issuer,
          authorization_endpoint: `${issuer}/authorize`,
          token_endpoint: `${issuer}/token`,
          jwks_uri: `${issuer}/.well-known/jwks.json`,
          grant_types_supported: ['client_credentials'],
          response_types_supported: ['none'],
          token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'bearer'],
          scopes_supported: ['mcp'],
        };
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Max-Age': '86400' } });
      }
      if (path.endsWith('/.well-known/oauth-protected-resource') || path.includes('/.well-known/oauth-protected-resource')) {
        const handler = protectedResourceHandler({ authServerUrls: [] });
        return handler(request);
      }
      if (path.includes('/.well-known/')) {
        return new Response('Not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Max-Age': '86400' } });
      }
    }
    if (request.method === 'GET') {
      if (MCP_API_KEY) {
        const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '') || request.headers.get('X-API-Key');
        if (!apiKey || apiKey !== MCP_API_KEY) {
          return new Response('Unauthorized', { status: 401 });
        }
      }
      return handler(request);
    }
    if (request.method === 'POST') {
      const body = await request.clone().json().catch(() => ({}));
      const method = (body.method || '') as string;
      const discoveryMethods = new Set(['initialize', 'tools/list', 'resources/list', 'prompts/list', 'capabilities/list']);
      if (!discoveryMethods.has(method)) {
        authenticateRequest(request);
      }
    }
    return handler(request);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: error.message }, id: null }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    throw error;
  }
}

export { authenticatedHandler as GET, authenticatedHandler as POST, authenticatedHandler as DELETE };

export async function OPTIONS(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path.endsWith('/.well-known/oauth-protected-resource') || path.includes('/.well-known/oauth-protected-resource')) {
    const handler = metadataCorsOptionsRequestHandler();
    return handler();
  }
  if (path.endsWith('/.well-known/openid-configuration') || path.includes('/.well-known/openid-configuration')) {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Max-Age': '86400' } });
  }
  return new Response(null, { status: 204 });
}
