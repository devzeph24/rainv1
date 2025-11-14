/**
 * Test script to simulate a fresh agent creating a card and getting payment details
 * 
 * Usage:
 *   USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" PURCHASE_AMOUNT=5000 npm run test:agent-workflow
 */

import { getUserBalances, createCard, getCardSecrets } from '../lib/rain-api';
import { generateSessionIdForEnv } from '../lib/session-id';
import { decryptSecret } from '../lib/card-decrypt';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function main() {
  const userId = process.env.USER_ID || '68bac0d7-0918-4fcb-9a1f-0537fc5ee245';
  const purchaseAmount = process.env.PURCHASE_AMOUNT
    ? parseInt(process.env.PURCHASE_AMOUNT, 10)
    : 5000; // $50.00 default

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not defined');
  }
  const client = new ConvexHttpClient(convexUrl);

  console.log('🤖 Simulating Fresh Agent Workflow\n');
  console.log(`User ID: ${userId}`);
  console.log(`Purchase Amount: $${(purchaseAmount / 100).toFixed(2)}\n`);

  try {
    // Step 1: Check user balance
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 1: Checking User Balance');
    console.log('═══════════════════════════════════════════════════════');
    const balance = await getUserBalances(userId);
    const totalCharges =
      (balance.pendingCharges ?? 0) + (balance.postedCharges ?? 0);
    const availableCredit =
      balance.spendingPower ??
      balance.availableCredit ??
      (balance.creditLimit - totalCharges);

    console.log(`Credit Limit: $${(balance.creditLimit / 100).toFixed(2)}`);
    console.log(`Available Credit: $${(availableCredit / 100).toFixed(2)}`);
    console.log(`Purchase Needed: $${(purchaseAmount / 100).toFixed(2)}\n`);

    if (availableCredit < purchaseAmount) {
      console.log(
        `⚠️  Warning: Available credit ($${(availableCredit / 100).toFixed(2)}) is less than purchase amount ($${(purchaseAmount / 100).toFixed(2)})`,
      );
      console.log('   Proceeding anyway to test card creation...\n');
    } else {
      console.log('✅ Sufficient credit available\n');
    }

    // Step 2: Create virtual card
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 2: Creating Virtual Card');
    console.log('═══════════════════════════════════════════════════════');
    console.log(
      `Creating card with limit: $${(purchaseAmount / 100).toFixed(2)} (perAuthorization)`,
    );

    const card = await createCard(userId, {
      type: 'virtual',
      status: 'active',
      limit: {
        amount: purchaseAmount,
        frequency: 'perAuthorization',
      },
      configuration: {
        displayName: `Agent Purchase ${(purchaseAmount / 100).toFixed(2)}`,
      },
    });

    console.log('✅ Card created successfully!');
    console.log(`   Card ID: ${card.id}`);
    console.log(`   Last 4: ${card.last4}`);
    console.log(`   Status: ${card.status}`);
    console.log(`   Limit: $${(card.limit.amount / 100).toFixed(2)} ${card.limit.frequency}`);

    // Sync to Convex database (like MCP server does)
    console.log('\nSyncing card to Convex database...');
    try {
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
      console.log('✅ Card synced to Convex database\n');
    } catch (syncError) {
      console.error('⚠️  Failed to sync to Convex:', syncError);
      console.log('   (Card still created in Rain API)\n');
    }

    // Step 3: Get card payment details
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 3: Retrieving Card Payment Details');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Generating secure session...');

    const sessionData = generateSessionIdForEnv(
      process.env.RAIN_API_BASE_URL?.includes('api.raincards.xyz') ?? false,
    );
    console.log('✅ Session generated');

    console.log('Fetching encrypted card secrets...');
    const secrets = await getCardSecrets(card.id, sessionData.sessionId);
    console.log('✅ Encrypted secrets retrieved');

    console.log('Decrypting card data...');
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
    console.log('✅ Card data decrypted\n');

    // Final result
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS - Agent Workflow Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Full Card Details:');
    console.log(`  Card ID: ${card.id}`);
    console.log(`  User ID: ${userId}`);
    console.log(`  Last 4: ${card.last4}`);
    console.log(`  PAN (Card Number): ${pan}`);
    console.log(`  CVC: ${cvc}`);
    console.log(`  Expiration: ${card.expirationMonth}/${card.expirationYear}`);
    console.log(`  Status: ${card.status}`);
    console.log(`  Limit: $${(card.limit.amount / 100).toFixed(2)} ${card.limit.frequency}`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ Agent can now use this card to complete the purchase!');
  } catch (error) {
    console.error('\n❌ Agent Workflow FAILED:');
    console.error(error);
    process.exit(1);
  }
}

main();

