/**
 * Script to get processor details for a card from the Rain API
 * 
 * Usage:
 *   CARD_ID="c2e8ee4a-72b5-4a6d-98fc-f95214e00cad" npm run rain:get-processor-details
 * 
 * The processor card ID is the identifier assigned by the payment processor
 * (e.g., Marqeta, Galileo) that handles the actual card processing.
 */

import { getCardProcessorDetails } from '../lib/rain-api';

async function main() {
  const cardId = process.env.CARD_ID;

  if (!cardId) {
    console.error('❌ Error: CARD_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  CARD_ID="your-card-id" npm run rain:get-processor-details');
    process.exit(1);
  }

  console.log(`Fetching processor details for card ID: ${cardId}\n`);

  try {
    const processorDetails = await getCardProcessorDetails(cardId);

    console.log('✅ Processor details retrieved successfully!');
    console.log('\nProcessor Details:');
    console.log(JSON.stringify(processorDetails, null, 2));

    console.log('\n📋 Summary:');
    console.log(`  Processor Card ID: ${processorDetails.processorCardId}`);
    console.log(`  Time Based Secret: ${processorDetails.timeBasedSecret || 'Not provided'}`);

    console.log('\n💡 Note:');
    console.log('  - Processor Card ID is the identifier used by the payment processor');
    console.log('  - This is different from Rain\'s internal card ID');
    console.log('  - Use this ID when integrating with processor-specific APIs or webhooks');
  } catch (error) {
    console.error('\n❌ Error fetching processor details:');
    console.error(error);
    process.exit(1);
  }
}

main();

