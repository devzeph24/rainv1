/**
 * Script to sync users from Rain API to Convex database
 * 
 * Usage:
 *   npm run rain:sync-users
 * 
 * Or with filters:
 *   COMPANY_ID="..." npm run rain:sync-users
 *   LIMIT=50 npm run rain:sync-users
 */

import { getUsers } from '../lib/rain-api';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function main() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is required');
    console.error('  Make sure .env.local contains NEXT_PUBLIC_CONVEX_URL');
    process.exit(1);
  }

  // Initialize Convex client
  const client = new ConvexHttpClient(convexUrl);

  // Get filter options from environment variables
  const companyId = process.env.COMPANY_ID;
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : undefined;

  const options: {
    companyId?: string;
    limit?: number;
  } = {};

  if (companyId) {
    options.companyId = companyId;
  }
  if (limit) {
    options.limit = limit;
  }

  console.log('Fetching users from Rain API...');
  if (companyId) {
    console.log(`Filtering by companyId: ${companyId}`);
  }
  if (limit) {
    console.log(`Limit: ${limit}`);
  }

  try {
    // Fetch users from Rain API
    const users = await getUsers(options);

    console.log(`\n✅ Fetched ${users.length} user(s) from Rain API`);
    console.log('Syncing to Convex database...\n');

    let synced = 0;
    let errors = 0;

    // Sync each user to Convex
    for (const user of users) {
      try {
        // Map Rain API user to Convex schema format
        const syncData = {
          rainUserId: user.id,
          companyId: user.companyId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive,
          isTermsOfServiceAccepted: user.isTermsOfServiceAccepted,
          applicationStatus: user.applicationStatus as
            | 'notStarted'
            | 'approved'
            | 'pending'
            | 'needsInformation'
            | 'needsVerification'
            | 'manualReview'
            | 'denied'
            | 'locked'
            | 'canceled',
          addressLine1: user.address?.line1,
          addressLine2: user.address?.line2,
          addressCity: user.address?.city,
          addressRegion: user.address?.region,
          addressPostalCode: user.address?.postalCode,
          addressCountryCode: user.address?.countryCode,
          addressCountry: user.address?.country,
          phoneCountryCode: user.phoneCountryCode,
          phoneNumber: user.phoneNumber,
          walletAddress: user.walletAddress,
          solanaAddress: user.solanaAddress,
          applicationCompletionLinkUrl: user.applicationCompletionLink?.url,
          applicationCompletionLinkParams: user.applicationCompletionLink?.params,
          applicationExternalVerificationLinkUrl: user.applicationExternalVerificationLink?.url,
          applicationExternalVerificationLinkParams: user.applicationExternalVerificationLink?.params,
          applicationReason: user.applicationReason,
        };

        // Call Convex mutation to sync user
        await client.mutation(api.users.syncFromRain, syncData);
        
        synced++;
        console.log(`  ✓ Synced: ${user.firstName} ${user.lastName} (${user.email})`);
      } catch (error) {
        errors++;
        console.error(`  ✗ Error syncing user ${user.id} (${user.email}):`, error);
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`  Synced: ${synced} user(s)`);
    if (errors > 0) {
      console.log(`  Errors: ${errors} user(s)`);
    }
  } catch (error) {
    console.error('\n❌ Error fetching users from Rain API:');
    console.error(error);
    process.exit(1);
  }
}

main();

