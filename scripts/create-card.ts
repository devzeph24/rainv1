/**
 * Script to create a virtual card for a user with the Rain API
 * 
 * Usage:
 *   USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" npm run rain:create-card
 * 
 * Or with custom options:
 *   USER_ID="..." CARD_LIMIT_AMOUNT=1000 CARD_LIMIT_FREQUENCY="per24HourPeriod" npm run rain:create-card
 * 
 * Optional environment variables:
 *   - CARD_LIMIT_AMOUNT: Limit amount in cents (default: 1000000 = $10,000.00)
 *   - CARD_LIMIT_FREQUENCY: Limit frequency (default: "per24HourPeriod")
 *     Options: per24HourPeriod, per7DayPeriod, per30DayPeriod, perYearPeriod, allTime, perAuthorization
 *   - CARD_STATUS: Initial status (default: "notActivated")
 *     Options: notActivated, active, locked, canceled
 *   - CARD_DISPLAY_NAME: Display name for the card (optional)
 */

import { createCard, CreateCardRequest } from '../lib/rain-api';

async function main() {
  const userId = process.env.USER_ID;

  if (!userId) {
    console.error('❌ Error: USER_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  USER_ID="your-user-id" npm run rain:create-card');
    process.exit(1);
  }

  // Get card configuration from environment variables or use defaults
  const limitAmount = process.env.CARD_LIMIT_AMOUNT 
    ? parseInt(process.env.CARD_LIMIT_AMOUNT, 10) 
    : 1000000; // Default $10,000.00 (in cents)

  const limitFrequency = (process.env.CARD_LIMIT_FREQUENCY || 'per24HourPeriod') as 
    | 'per24HourPeriod'
    | 'per7DayPeriod'
    | 'per30DayPeriod'
    | 'perYearPeriod'
    | 'allTime'
    | 'perAuthorization';

  const cardStatus = (process.env.CARD_STATUS || 'notActivated') as 
    | 'notActivated'
    | 'active'
    | 'locked'
    | 'canceled';

  const displayName = process.env.CARD_DISPLAY_NAME;

  const cardData: CreateCardRequest = {
    type: 'virtual', // Focus on virtual cards only
    status: cardStatus,
    limit: {
      amount: limitAmount,
      frequency: limitFrequency,
    },
  };

  // Only include configuration if displayName is provided
  if (displayName) {
    cardData.configuration = {
      displayName,
    };
  }

  console.log(`Creating virtual card for user ID: ${userId}`);
  console.log('\nCard Configuration:');
  console.log(JSON.stringify(cardData, null, 2));

  try {
    const card = await createCard(userId, cardData);

    console.log('\n✅ Card created successfully!');
    console.log('\nCard Details:');
    console.log(JSON.stringify(card, null, 2));

    console.log('\n📋 Card Summary:');
    console.log(`  Card ID: ${card.id}`);
    console.log(`  Type: ${card.type}`);
    console.log(`  Status: ${card.status}`);
    console.log(`  Last 4: ${card.last4}`);
    console.log(`  Expires: ${card.expirationMonth}/${card.expirationYear}`);
    console.log(`  Limit: $${(card.limit.amount / 100).toFixed(2)} ${card.limit.frequency}`);
    console.log(`  Company ID: ${card.companyId}`);
    console.log(`  User ID: ${card.userId}`);
    
    if (card.tokenWallets && card.tokenWallets.length > 0) {
      console.log(`  Token Wallets: ${card.tokenWallets.join(', ')}`);
    }
  } catch (error) {
    console.error('\n❌ Error creating card:');
    console.error(error);
    process.exit(1);
  }
}

main();

