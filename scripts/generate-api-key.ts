/**
 * Generate an API key for a user
 * 
 * Usage:
 *   USER_ID="your_user_id" npm run generate:api-key
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import crypto from 'crypto';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is not defined');
}

const client = new ConvexHttpClient(convexUrl);

async function main() {
  const userId = process.env.USER_ID || 'test-user-123';
  const name = process.env.KEY_NAME || 'Generated Key';

  console.log(`Generating API key for user: ${userId}\n`);

  // Generate API key: led_<32 random hex chars>
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const key = `led_${randomBytes}`;
  const keyPrefix = key.substring(0, 12); // "led_" + 8 chars
  
  // Hash the key for storage
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  try {
    // Store in Convex
    const result = await client.mutation(api.apiKeys.create, {
      userId,
      keyHash,
      keyPrefix,
      name,
    });

    console.log('✅ API Key Generated Successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  SAVE THIS KEY - IT WILL NOT BE SHOWN AGAIN!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`API Key: ${key}`);
    console.log(`Key ID: ${result.keyId}`);
    console.log(`Key Prefix: ${result.keyPrefix}`);
    console.log(`Name: ${result.name || 'N/A'}`);
    console.log(`Created: ${new Date(result.createdAt).toISOString()}`);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Usage:');
    console.log(`  curl -H "Authorization: Bearer ${key}" ...`);
    console.log(`  curl -H "X-API-Key: ${key}" ...`);
  } catch (error) {
    console.error('❌ Error generating API key:', error);
    process.exit(1);
  }
}

main();

