/**
 * Script to get a card's encrypted data (PAN and CVC) from the Rain API
 * 
 * Usage:
 *   CARD_ID="94af0c92-5c11-4d0d-889c-f9093819cb18" USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" npm run rain:get-secrets
 * 
 * Or with custom SessionId:
 *   CARD_ID="..." SESSION_ID="your-session-id" npm run rain:get-secrets
 * 
 * Note: If SESSION_ID is not provided, a SessionId will be generated using the user's public key.
 */

import { getCardSecrets } from '../lib/rain-api';
import { generateSessionIdForEnv } from '../lib/session-id';
import { decryptSecret } from '../lib/card-decrypt';

async function main() {
  const cardId = process.env.CARD_ID;
  const userId = process.env.USER_ID;
  const sessionId = process.env.SESSION_ID;
  const useProduction = process.env.USE_PRODUCTION === 'true';

  if (!cardId) {
    console.error('❌ Error: CARD_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  CARD_ID="your-card-id" USER_ID="user-id" npm run rain:get-secrets');
    console.error('  or');
    console.error('  CARD_ID="your-card-id" SESSION_ID="your-session-id" npm run rain:get-secrets');
    process.exit(1);
  }

  // Generate SessionId if not provided
  let finalSessionId = sessionId;
  let secretKey: string | undefined;
  
  if (!finalSessionId) {
    // Generate a new SessionId according to Rain's specification
    console.log('Generating SessionId...');
    const sessionData = generateSessionIdForEnv(useProduction);
    finalSessionId = sessionData.sessionId;
    secretKey = sessionData.secretKey;
    console.log(`✅ SessionId generated`);
    console.log(`   SecretKey (keep this for decryption): ${secretKey}`);
  } else {
    // If SessionId is provided, we need the secretKey too
    secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      console.warn('⚠️  Warning: SESSION_ID provided but SECRET_KEY not found.');
      console.warn('   You will need SECRET_KEY to decrypt the card data.');
    }
  }

  console.log(`Fetching encrypted data for card ID: ${cardId}\n`);

  try {
    const secrets = await getCardSecrets(cardId, finalSessionId);

    console.log('✅ Card secrets retrieved successfully!');
    console.log('\nEncrypted Card Data:');
    console.log(JSON.stringify(secrets, null, 2));

    console.log('\n📋 Secrets Summary:');
    console.log(`  Encrypted PAN:`);
    console.log(`    IV: ${secrets.encryptedPan.iv}`);
    console.log(`    Data: ${secrets.encryptedPan.data.substring(0, 50)}... (truncated)`);
    
    console.log(`  Encrypted CVC:`);
    console.log(`    IV: ${secrets.encryptedCvc.iv}`);
    console.log(`    Data: ${secrets.encryptedCvc.data.substring(0, 50)}... (truncated)`);

    // Decrypt if we have the secretKey
    if (secretKey) {
      console.log('\n🔓 Decrypting card data...');
      try {
        const decryptedPan = decryptSecret(
          secrets.encryptedPan.data,
          secrets.encryptedPan.iv,
          secretKey
        );
        const decryptedCvc = decryptSecret(
          secrets.encryptedCvc.data,
          secrets.encryptedCvc.iv,
          secretKey
        );

        console.log('\n✅ Decrypted Card Details:');
        console.log(`  Card Number (PAN): ${decryptedPan}`);
        console.log(`  CVC: ${decryptedCvc}`);

        console.log('\n⚠️  Security Warning:');
        console.log('  - Never store decrypted card details');
        console.log('  - Only request full card details when absolutely necessary');
        console.log('  - Handle this data securely and in compliance with PCI DSS');
      } catch (decryptError) {
        console.error('\n❌ Error decrypting card data:');
        console.error(decryptError);
        console.log('\n💡 Make sure you have the correct SECRET_KEY that was used to generate the SessionId');
      }
    } else {
      console.log('\n💡 To decrypt the card data:');
      console.log('  - Use the secretKey that was generated with the SessionId');
      console.log('  - Or provide SECRET_KEY environment variable');
      console.log('  - Use the decryptSecret function with the encrypted data and secretKey');
    }
  } catch (error) {
    console.error('\n❌ Error fetching card secrets:');
    console.error(error);
    process.exit(1);
  }
}

main();

