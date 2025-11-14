/**
 * Script to get a single card by card ID from the Rain API
 * 
 * Usage:
 *   CARD_ID="94af0c92-5c11-4d0d-889c-f9093819cb18" npm run rain:get-card
 */

import { getCard } from '../lib/rain-api';

async function main() {
  const cardId = process.env.CARD_ID;

  if (!cardId) {
    console.error('❌ Error: CARD_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  CARD_ID="your-card-id" npm run rain:get-card');
    process.exit(1);
  }

  console.log(`Fetching card details for card ID: ${cardId}\n`);

  try {
    const card = await getCard(cardId);

    console.log('✅ Card retrieved successfully!');
    console.log('\nCard Details:');
    console.log(JSON.stringify(card, null, 2));

    console.log('\n📋 Card Summary:');
    console.log(`  Card ID: ${card.id}`);
    console.log(`  Company ID: ${card.companyId}`);
    console.log(`  User ID: ${card.userId}`);
    console.log(`  Type: ${card.type}`);
    console.log(`  Status: ${card.status}`);
    console.log(`  Last 4: ${card.last4}`);
    console.log(`  Expires: ${card.expirationMonth}/${card.expirationYear}`);
    console.log(`  Limit: $${(card.limit.amount / 100).toFixed(2)} ${card.limit.frequency}`);
    
    if (card.tokenWallets && card.tokenWallets.length > 0) {
      console.log(`  Token Wallets: ${card.tokenWallets.join(', ')}`);
    } else {
      console.log(`  Token Wallets: None`);
    }
  } catch (error) {
    console.error('\n❌ Error fetching card:');
    console.error(error);
    process.exit(1);
  }
}

main();

