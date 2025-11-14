/**
 * Script to get all cards for a user or company from the Rain API
 * 
 * Usage:
 *   npm run rain:get-cards
 * 
 * Or with filters:
 *   USER_ID="3c90c3cc-0d44-4b50-8888-8dd25736052a" npm run rain:get-cards
 *   COMPANY_ID="3c90c3cc-0d44-4b50-8888-8dd25736052a" npm run rain:get-cards
 *   STATUS="active" npm run rain:get-cards
 *   LIMIT=50 npm run rain:get-cards
 * 
 * Or with multiple filters:
 *   USER_ID="..." STATUS="active" LIMIT=50 npm run rain:get-cards
 */

import { getCards } from '../lib/rain-api';

async function main() {
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

  console.log('Fetching cards...');
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
    const cards = await getCards(options);

    console.log('\n✅ Cards retrieved successfully!');
    console.log(`\nFound ${cards.length} card(s):`);
    console.log('\nResponse:');
    console.log(JSON.stringify(cards, null, 2));

    if (cards.length > 0) {
      console.log('\n📋 Card Summary:');
      cards.forEach((card, index) => {
        console.log(`\n  Card ${index + 1}:`);
        console.log(`    ID: ${card.id}`);
        console.log(`    Type: ${card.type}`);
        console.log(`    Status: ${card.status}`);
        console.log(`    Last 4: ${card.last4}`);
        console.log(`    Expires: ${card.expirationMonth}/${card.expirationYear}`);
        console.log(`    Limit: $${card.limit.amount} ${card.limit.frequency}`);
      });
    }
  } catch (error) {
    console.error('\n❌ Error fetching cards:');
    console.error(error);
    process.exit(1);
  }
}

main();

