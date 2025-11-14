/**
 * Script to check the status of a user application from the Rain API
 * 
 * Usage:
 *   USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" npx tsx scripts/check-application-status.ts
 * 
 * Or with npm script:
 *   USER_ID="68bac0d7-0918-4fcb-9a1f-0537fc5ee245" npm run rain:check-status
 */

import { getUserApplication } from '../lib/rain-api';

async function main() {
  const userId = process.env.USER_ID;

  if (!userId) {
    console.error('❌ Error: USER_ID environment variable is required');
    console.error('\nUsage:');
    console.error('  USER_ID="your-user-id" npm run rain:check-status');
    process.exit(1);
  }

  console.log(`Checking application status for user ID: ${userId}\n`);

  try {
    const application = await getUserApplication(userId);

    console.log('✅ Application retrieved successfully!');
    console.log('\nApplication Details:');
    console.log(JSON.stringify(application, null, 2));

    console.log('\n📋 Status Summary:');
    console.log(`  Application ID: ${application.id}`);
    if (application.firstName || application.lastName) {
      console.log(`  Name: ${application.firstName || ''} ${application.lastName || ''}`.trim());
    }
    if (application.email) {
      console.log(`  Email: ${application.email}`);
    }
    console.log(`  Status: ${application.applicationStatus}`);
    if (application.isActive !== undefined) {
      console.log(`  Active: ${application.isActive}`);
    }
    if (application.isTermsOfServiceAccepted !== undefined) {
      console.log(`  Terms Accepted: ${application.isTermsOfServiceAccepted}`);
    }

    if (application.companyId) {
      console.log(`  Company ID: ${application.companyId}`);
    }

    if (application.address) {
      console.log('\n  Address:');
      if (application.address.street) console.log(`    Street: ${application.address.street}`);
      if (application.address.city) console.log(`    City: ${application.address.city}`);
      if (application.address.state) console.log(`    State: ${application.address.state}`);
      if (application.address.postalCode) console.log(`    Postal Code: ${application.address.postalCode}`);
      if (application.address.country) console.log(`    Country: ${application.address.country}`);
    }

    if (application.phoneNumber) {
      console.log(`  Phone: ${application.phoneCountryCode || ''} ${application.phoneNumber}`);
    }

    if (application.applicationExternalVerificationLink?.url) {
      console.log('\n  External Verification Link:');
      const url = new URL(application.applicationExternalVerificationLink.url);
      if (application.applicationExternalVerificationLink.params) {
        Object.entries(application.applicationExternalVerificationLink.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      console.log(`    ${url.toString()}`);
    }

    if (application.applicationCompletionLink?.url) {
      console.log('\n  Application Completion Link:');
      const url = new URL(application.applicationCompletionLink.url);
      if (application.applicationCompletionLink.params) {
        Object.entries(application.applicationCompletionLink.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      console.log(`    ${url.toString()}`);
    }

    if (application.applicationReason) {
      console.log(`\n  Reason: ${application.applicationReason}`);
    }
  } catch (error) {
    console.error('\n❌ Error fetching application:');
    console.error(error);
    process.exit(1);
  }
}

main();

