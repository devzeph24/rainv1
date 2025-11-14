/**
 * Script to update a card with the Rain API
 * 
 * Usage:
 *   CARD_ID="c2e8ee4a-72b5-4a6d-98fc-f95214e00cad" npm run rain:update-card
 * 
 * Or with custom options:
 *   CARD_ID="..." CARD_STATUS="active" CARD_LIMIT_AMOUNT=5000 CARD_LIMIT_FREQUENCY="per24HourPeriod" npm run rain:update-card
 * 
 * Optional environment variables:
 *   - CARD_STATUS: Card status (notActivated, active, locked, canceled)
 *   - CARD_LIMIT_AMOUNT: Limit amount in cents
 *   - CARD_LIMIT_FREQUENCY: Limit frequency (per24HourPeriod, per7DayPeriod, per30DayPeriod, perYearPeriod, allTime, perAuthorization)
 *   - BILLING_LINE1: Billing address line 1
 *   - BILLING_LINE2: Billing address line 2
 *   - BILLING_CITY: Billing city
 *   - BILLING_REGION: Billing region/state
 *   - BILLING_POSTAL_CODE: Billing postal code
 *   - BILLING_COUNTRY_CODE: Billing country code (e.g., "US")
 *   - BILLING_COUNTRY: Billing country name
 *   - VIRTUAL_CARD_ART: Virtual card art identifier
 */

import { updateCard, UpdateCardRequest } from '../lib/rain-api';

async function main() {
  const cardId = process.env.CARD_ID;

  if (!cardId) {
    console.error('❌ Error: CARD_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  CARD_ID="your-card-id" npm run rain:update-card');
    console.error('\nOptional parameters:');
    console.error('  CARD_STATUS="active"');
    console.error('  CARD_LIMIT_AMOUNT=5000');
    console.error('  CARD_LIMIT_FREQUENCY="per24HourPeriod"');
    console.error('  BILLING_LINE1="123 Main St"');
    console.error('  BILLING_CITY="Austin"');
    console.error('  BILLING_REGION="TX"');
    console.error('  BILLING_POSTAL_CODE="78701"');
    console.error('  BILLING_COUNTRY_CODE="US"');
    console.error('  VIRTUAL_CARD_ART="art-id"');
    process.exit(1);
  }

  const updateData: UpdateCardRequest = {};

  // Status
  if (process.env.CARD_STATUS) {
    const status = process.env.CARD_STATUS as 
      | 'notActivated'
      | 'active'
      | 'locked'
      | 'canceled';
    
    if (!['notActivated', 'active', 'locked', 'canceled'].includes(status)) {
      console.error(`❌ Error: Invalid CARD_STATUS "${status}"`);
      console.error('  Valid options: notActivated, active, locked, canceled');
      process.exit(1);
    }
    
    updateData.status = status;
  }

  // Limit
  if (process.env.CARD_LIMIT_AMOUNT || process.env.CARD_LIMIT_FREQUENCY) {
    const limitAmount = process.env.CARD_LIMIT_AMOUNT 
      ? parseInt(process.env.CARD_LIMIT_AMOUNT, 10) 
      : undefined;
    
    const limitFrequency = process.env.CARD_LIMIT_FREQUENCY as 
      | 'per24HourPeriod'
      | 'per7DayPeriod'
      | 'per30DayPeriod'
      | 'perYearPeriod'
      | 'allTime'
      | 'perAuthorization'
      | undefined;

    if (limitFrequency && ![
      'per24HourPeriod',
      'per7DayPeriod',
      'per30DayPeriod',
      'perYearPeriod',
      'allTime',
      'perAuthorization'
    ].includes(limitFrequency)) {
      console.error(`❌ Error: Invalid CARD_LIMIT_FREQUENCY "${limitFrequency}"`);
      console.error('  Valid options: per24HourPeriod, per7DayPeriod, per30DayPeriod, perYearPeriod, allTime, perAuthorization');
      process.exit(1);
    }

    if (limitAmount !== undefined || limitFrequency) {
      updateData.limit = {
        amount: limitAmount ?? 0, // Default to 0 if not provided
        frequency: limitFrequency ?? 'per24HourPeriod', // Default frequency
      };
      if (limitAmount !== undefined) {
        updateData.limit.amount = limitAmount;
      }
      if (limitFrequency) {
        updateData.limit.frequency = limitFrequency;
      }
    }
  }

  // Billing address
  if (
    process.env.BILLING_LINE1 ||
    process.env.BILLING_LINE2 ||
    process.env.BILLING_CITY ||
    process.env.BILLING_REGION ||
    process.env.BILLING_POSTAL_CODE ||
    process.env.BILLING_COUNTRY_CODE ||
    process.env.BILLING_COUNTRY
  ) {
    updateData.billing = {};
    
    if (process.env.BILLING_LINE1) {
      updateData.billing.line1 = process.env.BILLING_LINE1;
    }
    if (process.env.BILLING_LINE2) {
      updateData.billing.line2 = process.env.BILLING_LINE2;
    }
    if (process.env.BILLING_CITY) {
      updateData.billing.city = process.env.BILLING_CITY;
    }
    if (process.env.BILLING_REGION) {
      updateData.billing.region = process.env.BILLING_REGION;
    }
    if (process.env.BILLING_POSTAL_CODE) {
      updateData.billing.postalCode = process.env.BILLING_POSTAL_CODE;
    }
    if (process.env.BILLING_COUNTRY_CODE) {
      updateData.billing.countryCode = process.env.BILLING_COUNTRY_CODE;
    }
    if (process.env.BILLING_COUNTRY) {
      updateData.billing.country = process.env.BILLING_COUNTRY;
    }
  }

  // Configuration
  if (process.env.VIRTUAL_CARD_ART) {
    updateData.configuration = {
      virtualCardArt: process.env.VIRTUAL_CARD_ART,
    };
  }

  // Check if any update data was provided
  if (Object.keys(updateData).length === 0) {
    console.error('❌ Error: No update data provided');
    console.error('  Please provide at least one of: CARD_STATUS, CARD_LIMIT_AMOUNT, CARD_LIMIT_FREQUENCY, billing address, or VIRTUAL_CARD_ART');
    process.exit(1);
  }

  console.log(`Updating card ID: ${cardId}`);
  console.log('\nUpdate Data:');
  console.log(JSON.stringify(updateData, null, 2));

  try {
    const card = await updateCard(cardId, updateData);

    console.log('\n✅ Card updated successfully!');
    console.log('\nUpdated Card Details:');
    console.log(JSON.stringify(card, null, 2));

    console.log('\n📋 Card Summary:');
    console.log(`  Card ID: ${card.id}`);
    console.log(`  Type: ${card.type}`);
    console.log(`  Status: ${card.status}`);
    console.log(`  Last 4: ${card.last4}`);
    console.log(`  Expires: ${card.expirationMonth}/${card.expirationYear}`);
    console.log(`  Limit: $${(card.limit.amount / 100).toFixed(2)} ${card.limit.frequency}`);
    if (card.companyId) {
      console.log(`  Company ID: ${card.companyId}`);
    }
    console.log(`  User ID: ${card.userId}`);
    
    if (card.tokenWallets && card.tokenWallets.length > 0) {
      console.log(`  Token Wallets: ${card.tokenWallets.join(', ')}`);
    }
  } catch (error) {
    console.error('\n❌ Error updating card:');
    console.error(error);
    process.exit(1);
  }
}

main();

