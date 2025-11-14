/**
 * Test script to verify MCP server can retrieve full card payment details
 * 
 * Usage:
 *   CARD_ID="c2e8ee4a-72b5-4a6d-98fc-f95214e00cad" USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" npm run test:mcp-card-details
 */

import { getCardSecrets } from '../lib/rain-api';
import { generateSessionIdForEnv } from '../lib/session-id';
import { decryptSecret } from '../lib/card-decrypt';

async function main() {
  const cardId = process.env.CARD_ID;
  const userId = process.env.USER_ID;
  const useProduction = process.env.USE_PRODUCTION === 'true';

  if (!cardId || !userId) {
    console.error('❌ Error: CARD_ID and USER_ID environment variables are required');
    console.error('\nUsage:');
    console.error('  CARD_ID="..." USER_ID="..." npm run test:mcp-card-details');
    process.exit(1);
  }

  console.log('Testing MCP Card Payment Details Flow\n');
  console.log(`Card ID: ${cardId}`);
  console.log(`User ID: ${userId}\n`);

  try {
    console.log('Step 1: Generating secure session ID...');
    const sessionData = generateSessionIdForEnv(useProduction);
    console.log(`✅ Session ID generated`);
    console.log(`   Secret Key: ${sessionData.secretKey.substring(0, 20)}...\n`);

    console.log('Step 2: Fetching encrypted card secrets from Rain API...');
    const secrets = await getCardSecrets(cardId, sessionData.sessionId);
    console.log('✅ Encrypted secrets retrieved\n');

    console.log('Step 3: Decrypting card data...');
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
    console.log('✅ Card data decrypted successfully!\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS - Full Card Details Retrieved:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Card ID: ${cardId}`);
    console.log(`User ID: ${userId}`);
    console.log(`PAN (Card Number): ${pan}`);
    console.log(`CVC: ${cvc}`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ MCP server flow test PASSED!');
    console.log('   The MCP action get_card_payment_details will work correctly.');
  } catch (error) {
    console.error('\n❌ Test FAILED:');
    console.error(error);
    process.exit(1);
  }
}

main();

