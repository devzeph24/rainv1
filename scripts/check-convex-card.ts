/**
 * Quick script to check if a card exists in Convex database
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is not defined');
}

const client = new ConvexHttpClient(convexUrl);

async function main() {
  const cardId = process.env.CARD_ID || 'c6eedbb1-3f76-4ad0-a636-545f5eb6a7a3';

  console.log(`Checking for card ${cardId} in Convex database...\n`);

  try {
    const card = await client.query(api.cards.getByRainId, {
      rainCardId: cardId,
    });

    if (card) {
      console.log('✅ Card found in Convex database!');
      console.log(JSON.stringify(card, null, 2));
    } else {
      console.log('❌ Card not found in Convex database');
      console.log('   This means it was created in Rain API but not synced to Convex');
    }
  } catch (error) {
    console.error('Error querying Convex:', error);
  }
}

main();

