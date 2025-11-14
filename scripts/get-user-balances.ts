/**
 * Script to get user balances and credit limits from the Rain API
 * 
 * Usage:
 *   USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" npm run rain:get-balances
 */

import { getUserBalances } from '../lib/rain-api';

async function main() {
  const userId = process.env.USER_ID;

  if (!userId) {
    console.error('❌ Error: USER_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  USER_ID="your-user-id" npm run rain:get-balances');
    process.exit(1);
  }

  console.log(`Fetching balances for user ID: ${userId}\n`);

  try {
    const balances = await getUserBalances(userId);

    console.log('✅ Balances retrieved successfully!');
    console.log('\nBalance Details:');
    console.log(JSON.stringify(balances, null, 2));

    console.log('\n📋 Balance Summary:');
    console.log(`  Credit Limit: $${(balances.creditLimit / 100).toFixed(2)}`);
    
    if (balances.outstandingCharges !== undefined) {
      console.log(`  Outstanding Charges: $${(balances.outstandingCharges / 100).toFixed(2)}`);
    }
    
    if (balances.balancesDue !== undefined) {
      console.log(`  Balances Due: $${(balances.balancesDue / 100).toFixed(2)}`);
    }
    
    if (balances.availableCredit !== undefined) {
      console.log(`  Available Credit: $${(balances.availableCredit / 100).toFixed(2)}`);
    } else if (balances.creditLimit !== undefined && balances.outstandingCharges !== undefined) {
      const available = balances.creditLimit - balances.outstandingCharges;
      console.log(`  Available Credit (calculated): $${(available / 100).toFixed(2)}`);
    }

    console.log('\n💡 Note:');
    console.log('  - Credit limits update within minutes after collateral is deposited');
    console.log('  - Amounts are shown in cents (divide by 100 for dollars)');
  } catch (error) {
    console.error('\n❌ Error fetching balances:');
    console.error(error);
    process.exit(1);
  }
}

main();

