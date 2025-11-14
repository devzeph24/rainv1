/**
 * Script to create a smart contract for a user on the Rain API
 * 
 * Usage:
 *   USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" CHAIN_ID=101 npm run rain:create-contract
 * 
 * Common Chain IDs:
 *   - Solana Mainnet: 101
 *   - Solana Devnet: 103
 *   - Ethereum Mainnet: 1
 *   - Base: 8453
 */

import { createUserContract } from '../lib/rain-api';

async function main() {
  const userId = process.env.USER_ID;
  const chainIdStr = process.env.CHAIN_ID;

  if (!userId) {
    console.error('❌ Error: USER_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  USER_ID="your-user-id" CHAIN_ID=101 npm run rain:create-contract');
    process.exit(1);
  }

  if (!chainIdStr) {
    console.error('❌ Error: CHAIN_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  USER_ID="your-user-id" CHAIN_ID=101 npm run rain:create-contract');
    console.error('\nCommon Chain IDs:');
    console.error('  - Solana Mainnet: 101');
    console.error('  - Solana Devnet: 103');
    process.exit(1);
  }

  const chainId = parseInt(chainIdStr, 10);

  if (isNaN(chainId)) {
    console.error('❌ Error: CHAIN_ID must be a valid number');
    process.exit(1);
  }

  console.log(`Creating smart contract for user ID: ${userId}`);
  console.log(`Chain ID: ${chainId}`);

  // Show friendly chain name if known
  const chainNames: Record<number, string> = {
    101: 'Solana Mainnet',
    103: 'Solana Devnet',
    1: 'Ethereum Mainnet',
    8453: 'Base',
    728126428: 'Tron Mainnet',
    201910292: 'Tron Shasta Testnet',
  };

  if (chainNames[chainId]) {
    console.log(`Chain: ${chainNames[chainId]}`);
  }

  console.log('\nNote: User must have an EVM or Solana address to create a contract.\n');

  try {
    const contract = await createUserContract(userId, chainId);

    console.log('✅ Contract created successfully!');
    console.log('\nContract Details:');
    console.log(JSON.stringify(contract, null, 2));

    console.log('\n📋 Contract Summary:');
    console.log(`  Contract ID: ${contract.id}`);
    console.log(`  Chain ID: ${contract.chainId}`);
    console.log(`  Proxy Address: ${contract.proxyAddress}`);
    
    if (contract.controllerAddress) {
      console.log(`  Controller Address: ${contract.controllerAddress}`);
    }
    
    if (contract.programAddress) {
      console.log(`  Program Address (Solana): ${contract.programAddress}`);
    }
    
    if (contract.depositAddress) {
      console.log(`  Deposit Address: ${contract.depositAddress}`);
    }
    
    console.log(`  Contract Version: ${contract.contractVersion}`);
    console.log(`  Supported Tokens: ${contract.tokens.length}`);

    if (contract.tokens.length > 0) {
      console.log('\n  Tokens:');
      contract.tokens.forEach((token, index) => {
        console.log(`    Token ${index + 1}:`);
        console.log(`      Address: ${token.address}`);
        if (token.balance) {
          console.log(`      Balance: ${token.balance}`);
        }
        if (token.exchangeRate !== undefined) {
          console.log(`      Exchange Rate: ${token.exchangeRate}`);
        }
        if (token.advanceRate !== undefined) {
          console.log(`      Advance Rate: ${token.advanceRate}`);
        }
      });
    }

    if (contract.onramp) {
      console.log('\n  Onramp Information Available:');
      if (contract.onramp.ach) {
        console.log('    - ACH');
      }
      if (contract.onramp.rtp) {
        console.log('    - RTP');
      }
      if (contract.onramp.wire) {
        console.log('    - Wire');
      }
    }

    console.log('\n💡 Next Steps:');
    console.log('  - Users can deposit collateral to the proxy/deposit address');
    console.log('  - Once collateral is deposited, credit limits will update within minutes');
    console.log('  - Use the supported token addresses for deposits');
  } catch (error) {
    console.error('\n❌ Error creating contract:');
    console.error(error);
    process.exit(1);
  }
}

main();

