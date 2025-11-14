/**
 * Script to initiate a user application with the Rain API
 * 
 * Usage:
 *   npx tsx scripts/initiate-application.ts
 * 
 * Or with custom data:
 *   FIRST_NAME="John" LAST_NAME="Doe" EMAIL="john@example.com" npx tsx scripts/initiate-application.ts
 */

import { initiateUserApplication } from '../lib/rain-api';

async function main() {
  // Get user data from environment variables or use defaults
  const firstName = process.env.FIRST_NAME || 'Jane';
  const lastName = process.env.LAST_NAME || 'Smith';
  const email = process.env.EMAIL || `test-${Date.now()}@example.com`;
  const walletAddress = process.env.WALLET_ADDRESS; // Optional, only include if provided

  const applicationData: {
    firstName: string;
    lastName: string;
    email: string;
    walletAddress?: string;
  } = {
    firstName,
    lastName,
    email,
  };

  // Only include walletAddress if it was explicitly provided
  if (walletAddress) {
    applicationData.walletAddress = walletAddress;
  }

  console.log('Initiating user application...');
  console.log('Data:', applicationData);

  try {
    const result = await initiateUserApplication(applicationData);

    console.log('\n✅ Application initiated successfully!');
    console.log('\nResponse:');
    console.log(JSON.stringify(result, null, 2));

    if (result.applicationCompletionLink?.url) {
      console.log('\n📋 Application Completion Link:');
      
      // Construct full URL with query parameters
      const url = new URL(result.applicationCompletionLink.url);
      if (result.applicationCompletionLink.params) {
        Object.entries(result.applicationCompletionLink.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      console.log(url.toString());
    }
  } catch (error) {
    console.error('\n❌ Error initiating application:');
    console.error(error);
    process.exit(1);
  }
}

main();

