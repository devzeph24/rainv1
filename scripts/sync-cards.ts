/**
 * Script to sync cards from Rain API to Convex database
 * 
 * Usage:
 *   npm run rain:sync-cards
 * 
 * Or with filters:
 *   USER_ID="..." npm run rain:sync-cards
 *   COMPANY_ID="..." npm run rain:sync-cards
 *   STATUS="active" npm run rain:sync-cards
 *   LIMIT=50 npm run rain:sync-cards
 */

import { getCards } from '../lib/rain-api';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function main() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is required');
    console.error('  Make sure .env.local contains NEXT_PUBLIC_CONVEX_URL');
    process.exit(1);
  }

  // Initialize Convex client
  const client = new ConvexHttpClient(convexUrl);

  // Get filter options from environment variables
  const userId = process.env.USER_ID;
  const companyId = process.env.COMPANY_ID;
  const status = process.env.STATUS as 'notActivated' | 'active' | 'locked' | 'canceled' | undefined;
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : undefined;

  const options: {
    userId?: string;
    companyId?: string;
    status?: 'notActivated' | 'active' | 'locked' | 'canceled';
    limit?: number;
  } = {};

  if (userId) {
    options.userId = userId;
  }
  if (companyId) {
    options.companyId = companyId;
  }
  if (status) {
    options.status = status;
  }
  if (limit) {
    options.limit = limit;
  }

  console.log('Fetching cards from Rain API...');
  if (userId) {
    console.log(`Filtering by userId: ${userId}`);
  }
  if (companyId) {
    console.log(`Filtering by companyId: ${companyId}`);
  }
  if (status) {
    console.log(`Filtering by status: ${status}`);
  }
  if (limit) {
    console.log(`Limit: ${limit}`);
  }
  if (!userId && !companyId && !status && !limit) {
    console.log('No filters applied - fetching all cards (default limit: 20)');
  }

  try {
    // Fetch cards from Rain API
    const cards = await getCards(options);

    console.log(`\n✅ Fetched ${cards.length} card(s) from Rain API`);
    console.log('Syncing to Convex database...\n');

    let synced = 0;
    let errors = 0;

    // Sync each card to Convex
    for (const card of cards) {
      try {
        // Map Rain API card to Convex schema format
        const syncData = {
          rainCardId: card.id,
          companyId: card.companyId,
          userId: card.userId,
          type: card.type as 'physical' | 'virtual',
          status: card.status as
            | 'notActivated'
            | 'activated'
            | 'active'
            | 'locked'
            | 'canceled',
          limitAmount: card.limit.amount,
          limitFrequency: card.limit.frequency as
            | 'per24HourPeriod'
            | 'per7DayPeriod'
            | 'per30DayPeriod'
            | 'perYear'
            | 'perYearPeriod'
            | 'allTime'
            | 'perAuthorization',
          last4: card.last4,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear,
          tokenWallets: card.tokenWallets,
        };

        // Call Convex mutation to sync card
        await client.mutation(api.cards.syncFromRain, syncData);
        
        synced++;
        console.log(`  ✓ Synced: Card ${card.last4} (${card.type}, ${card.status}) - User: ${card.userId}`);
      } catch (error) {
        errors++;
        console.error(`  ✗ Error syncing card ${card.id} (${card.last4}):`, error);
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`  Synced: ${synced} card(s)`);
    if (errors > 0) {
      console.log(`  Errors: ${errors} card(s)`);
    }
  } catch (error) {
    console.error('\n❌ Error fetching cards from Rain API:');
    console.error(error);
    process.exit(1);
  }
}

main();

