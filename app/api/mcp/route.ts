import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import {
  createCard,
  getCardSecrets,
  getUserBalances,
} from '@/lib/rain-api';
import { generateSessionIdForEnv } from '@/lib/session-id';
import { decryptSecret } from '@/lib/card-decrypt';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is not defined');
}

const client = new ConvexHttpClient(convexUrl);

const handler = createMcpHandler(
  (server) => {
    /**
     * Get user balance and credit information
     * Fetches fresh data from Rain API and syncs to Convex
     */
    server.tool(
      'get_user_balance',
      'Get balance and credit limit information for a user. Fetches fresh data from Rain API. Use this to check available credit before creating a card.',
      {
        userId: z.string().describe('The Rain user ID'),
      },
      async ({ userId }) => {
        try {
          // Fetch fresh balance from Rain API (balances change frequently)
          const balance = await getUserBalances(userId);

          // Calculate available credit from actual API fields
          const totalCharges =
            (balance.pendingCharges ?? 0) + (balance.postedCharges ?? 0);
          const availableCredit =
            balance.spendingPower ??
            balance.availableCredit ??
            (balance.creditLimit - totalCharges);

          // Sync to Convex for caching (map to Convex schema)
          try {
            await client.mutation(api.balances.syncFromRain, {
              userId,
              creditLimit: balance.creditLimit,
              outstandingCharges:
                balance.outstandingCharges ??
                totalCharges,
              balancesDue: balance.balancesDue ?? balance.balanceDue,
              availableCredit,
            });
          } catch (syncError) {
            // Log but don't fail - balance fetch succeeded
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
              {
                type: 'text',
                text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );

    /**
     * Create a virtual card for a user
     */
    server.tool(
      'create_virtual_card',
      'Create a virtual card for a user with specified spending limits. Use this when an agent needs to make a purchase.',
      {
        userId: z.string().describe('The Rain user ID'),
        limitAmount: z
          .number()
          .int()
          .min(1)
          .describe('Spending limit amount in cents (e.g., 10000 = $100.00)'),
        limitFrequency: z
          .enum([
            'per24HourPeriod',
            'per7DayPeriod',
            'per30DayPeriod',
            'perYearPeriod',
            'allTime',
            'perAuthorization',
          ])
          .default('perAuthorization')
          .describe('How often the limit applies'),
        displayName: z
          .string()
          .optional()
          .describe('Optional display name for the card'),
        status: z
          .enum(['notActivated', 'active'])
          .default('active')
          .describe('Initial card status'),
      },
      async ({ userId, limitAmount, limitFrequency, displayName, status }) => {
        try {
          // Create card via Rain API
          const card = await createCard(userId, {
            type: 'virtual',
            status,
            limit: {
              amount: limitAmount,
              frequency: limitFrequency,
            },
            configuration: displayName ? { displayName } : undefined,
          });

          // Sync to Convex
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
                    message: 'Card created successfully. Use get_card_payment_details to retrieve PAN and CVC.',
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
              {
                type: 'text',
                text: `Error creating card: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );

    /**
     * Get card payment details (PAN and CVC)
     */
    server.tool(
      'get_card_payment_details',
      'Get the card number (PAN) and CVC for a card. Use this to complete a purchase. WARNING: Only request when ready to make payment.',
      {
        cardId: z.string().describe('The Rain card ID'),
        userId: z
          .string()
          .describe('The Rain user ID (required for session generation)'),
      },
      async ({ cardId, userId }) => {
        try {
          // Generate session ID for secure card data retrieval
          const sessionData = generateSessionIdForEnv(
            process.env.RAIN_API_BASE_URL?.includes('api.raincards.xyz') ??
              false,
          );

          // Get encrypted card secrets
          const secrets = await getCardSecrets(cardId, sessionData.sessionId);

          // Decrypt the card data
          const pan = decryptSecret(
            secrets.encryptedPan.data,
            secrets.encryptedPan.iv,
            sessionData.secretKey,
          );
          const cvc = decryptSecret(
            secrets.encryptedCvc.data,
            secrets.encryptedCvc.iv,
            sessionData.secretKey,
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cardId,
                    pan,
                    cvc,
                    warning:
                      'Keep this information secure. Only use for the intended purchase.',
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
              {
                type: 'text',
                text: `Error fetching card details: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );

    /**
     * Get all cards for a user
     */
    server.tool(
      'get_user_cards',
      'Get all cards for a user. Use this to see existing cards before creating a new one.',
      {
        userId: z.string().describe('The Rain user ID'),
      },
      async ({ userId }) => {
        try {
          const cards = await client.query(api.cards.getByUserId, { userId });

          if (cards.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `No cards found for user ${userId}`,
                },
              ],
            };
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
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching cards: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );

    /**
     * Get card details
     */
    server.tool(
      'get_card_details',
      'Get detailed information about a specific card including status and limits.',
      {
        cardId: z.string().describe('The Rain card ID'),
      },
      async ({ cardId }) => {
        try {
          const card = await client.query(api.cards.getByRainId, {
            rainCardId: cardId,
          });

          if (!card) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Card with ID ${cardId} not found in database.`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
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
              {
                type: 'text',
                text: `Error fetching card: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );

    /**
     * Update card status (lock/unlock/cancel)
     */
    server.tool(
      'update_card_status',
      'Update a card status. Use "locked" to secure a card after purchase, "active" to unlock it, or "canceled" to permanently disable it.',
      {
        cardId: z.string().describe('The Rain card ID'),
        status: z
          .enum(['notActivated', 'active', 'locked', 'canceled'])
          .describe('New card status'),
      },
      async ({ cardId, status }) => {
        try {
          // Update via Rain API
          const { updateCard } = await import('@/lib/rain-api');
          const updatedCard = await updateCard(cardId, { status });

          // Sync to Convex
          await client.mutation(api.cards.updateStatus, {
            rainCardId: cardId,
            status: updatedCard.status,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cardId: updatedCard.id,
                    status: updatedCard.status,
                    message: `Card status updated to ${status}`,
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
              {
                type: 'text',
                text: `Error updating card status: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );

    /**
     * Update card spending limit
     */
    server.tool(
      'update_card_limit',
      'Update the spending limit for a card. Use this if the purchase amount changes or you need to adjust limits.',
      {
        cardId: z.string().describe('The Rain card ID'),
        limitAmount: z
          .number()
          .int()
          .min(1)
          .describe('New spending limit amount in cents'),
        limitFrequency: z
          .enum([
            'per24HourPeriod',
            'per7DayPeriod',
            'per30DayPeriod',
            'perYearPeriod',
            'allTime',
            'perAuthorization',
          ])
          .describe('How often the limit applies'),
      },
      async ({ cardId, limitAmount, limitFrequency }) => {
        try {
          // Update via Rain API
          const { updateCard } = await import('@/lib/rain-api');
          const updatedCard = await updateCard(cardId, {
            limit: {
              amount: limitAmount,
              frequency: limitFrequency,
            },
          });

          // Sync to Convex
          await client.mutation(api.cards.updateLimit, {
            rainCardId: cardId,
            limitAmount: updatedCard.limit.amount,
            limitFrequency: updatedCard.limit.frequency,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cardId: updatedCard.id,
                    limit: {
                      amount: updatedCard.limit.amount,
                      amountDollars: (updatedCard.limit.amount / 100).toFixed(
                        2,
                      ),
                      frequency: updatedCard.limit.frequency,
                    },
                    message: 'Card limit updated successfully',
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
              {
                type: 'text',
                text: `Error updating card limit: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );
  },
  {},
  { basePath: '/api' },
);

export { handler as GET, handler as POST, handler as DELETE };
