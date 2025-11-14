/**
 * Script to get user collateral contracts from the Rain API
 * 
 * Usage:
 *   USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" npm run rain:get-contracts
 */

import { getUserContracts } from '../lib/rain-api';

async function main() {
  const userId = process.env.USER_ID;

  if (!userId) {
    console.error('❌ Error: USER_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  USER_ID="your-user-id" npm run rain:get-contracts');
    process.exit(1);
  }

  console.log(`Fetching contracts for user ID: ${userId}\n`);

  try {
    const contracts = await getUserContracts(userId);

    console.log('✅ Contracts retrieved successfully!');
    console.log(`\nFound ${contracts.length} contract(s):`);
    console.log('\nContracts:');
    console.log(JSON.stringify(contracts, null, 2));

    if (contracts.length > 0) {
      console.log('\n📋 Contract Summary:');
      contracts.forEach((contract, index) => {
        console.log(`\n  Contract ${index + 1}:`);
        console.log(`    Contract ID: ${contract.id}`);
        console.log(`    Proxy Address: ${contract.proxyAddress}`);
        console.log(`    Chain ID: ${contract.chainId}`);
        console.log(`    Contract Version: ${contract.contractVersion}`);
        
        if (contract.controllerAddress) {
          console.log(`    Controller Address: ${contract.controllerAddress}`);
        }
        
        if (contract.programAddress) {
          console.log(`    Program Address (Solana): ${contract.programAddress}`);
        }
        
        if (contract.depositAddress) {
          console.log(`    Deposit Address: ${contract.depositAddress}`);
        }
        
        console.log(`    Supported Tokens: ${contract.tokens.length}`);
        contract.tokens.forEach((token, tokenIndex) => {
          console.log(`      Token ${tokenIndex + 1}:`);
          console.log(`        Address: ${token.address}`);
          if (token.symbol) {
            console.log(`        Symbol: ${token.symbol}`);
          }
          if (token.decimals !== undefined) {
            console.log(`        Decimals: ${token.decimals}`);
          }
          if (token.name) {
            console.log(`        Name: ${token.name}`);
          }
          if (token.balance) {
            console.log(`        Balance: ${token.balance}`);
          }
          if (token.exchangeRate !== undefined) {
            console.log(`        Exchange Rate: ${token.exchangeRate}`);
          }
          if (token.advanceRate !== undefined) {
            console.log(`        Advance Rate: ${token.advanceRate}`);
          }
        });

        if (contract.onramp) {
          console.log(`    Onramp Available: ${contract.onramp.ach || contract.onramp.rtp || contract.onramp.wire ? 'Yes' : 'No'}`);
        }
      });

      console.log('\n💡 Next Steps:');
      console.log('  - Users can deposit collateral to the proxy address on the specified chain');
      console.log('  - Once collateral is deposited, credit limits will update within minutes');
      console.log('  - Use the proxy address and supported token addresses for deposits');
    }
  } catch (error) {
    console.error('\n❌ Error fetching contracts:');
    console.error(error);
    process.exit(1);
  }
}

main();

