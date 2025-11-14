/**
 * Script to get all users from the Rain API
 * 
 * Usage:
 *   npm run rain:get-users
 * 
 * Or with filters:
 *   COMPANY_ID="3c90c3cc-0d44-4b50-8888-8dd25736052a" npm run rain:get-users
 *   LIMIT=50 npm run rain:get-users
 *   CURSOR="..." npm run rain:get-users
 * 
 * Or with multiple filters:
 *   COMPANY_ID="..." LIMIT=50 npm run rain:get-users
 */

import { getUsers } from '../lib/rain-api';

async function main() {
  // Get filter options from environment variables
  const companyId = process.env.COMPANY_ID;
  const cursor = process.env.CURSOR;
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : undefined;

  const options: {
    companyId?: string;
    cursor?: string;
    limit?: number;
  } = {};

  if (companyId) {
    options.companyId = companyId;
  }
  if (cursor) {
    options.cursor = cursor;
  }
  if (limit) {
    options.limit = limit;
  }

  console.log('Fetching users...');
  if (companyId) {
    console.log(`Filtering by companyId: ${companyId}`);
  }
  if (limit) {
    console.log(`Limit: ${limit}`);
  }
  if (cursor) {
    console.log(`Cursor: ${cursor}`);
  }
  if (!companyId && !limit && !cursor) {
    console.log('No filters applied - fetching all users (default limit: 20)');
  }

  try {
    const users = await getUsers(options);

    console.log('\n✅ Users retrieved successfully!');
    console.log(`\nFound ${users.length} user(s):`);
    console.log('\nResponse:');
    console.log(JSON.stringify(users, null, 2));

    if (users.length > 0) {
      console.log('\n📋 User Summary:');
      users.forEach((user, index) => {
        console.log(`\n  User ${index + 1}:`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Name: ${user.firstName} ${user.lastName}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Status: ${user.applicationStatus}`);
        console.log(`    Active: ${user.isActive}`);
        console.log(`    Terms Accepted: ${user.isTermsOfServiceAccepted}`);
        if (user.companyId) {
          console.log(`    Company ID: ${user.companyId}`);
        }
        if (user.walletAddress) {
          console.log(`    Wallet (EVM): ${user.walletAddress}`);
        }
        if (user.solanaAddress) {
          console.log(`    Wallet (Solana): ${user.solanaAddress}`);
        }
        if (user.address) {
          console.log(`    Address: ${user.address.line1 || ''} ${user.address.city || ''} ${user.address.region || ''} ${user.address.postalCode || ''}`);
        }
      });
    }
  } catch (error) {
    console.error('\n❌ Error fetching users:');
    console.error(error);
    process.exit(1);
  }
}

main();

