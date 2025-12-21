# Test Card Mode

This project includes a test card mode that allows you to simulate card creation without hitting the Rain API, avoiding costs during development and testing.

## Test Card Details

When test mode is enabled, all card creation requests will return the same test card:

- **Card Number (PAN)**: `4549240609436532`
- **Expiration**: `11/2030` (Month: `11`, Year: `2030`)
- **CVV**: `906`
- **Last 4**: `6532`
- **Billing Address**: 
  - Line 1: `415 mission st`
  - City: `san francisco`
  - Region: `ca`
  - Postal Code: `94105`
  - Country: `United States` (US)

## Enabling Test Mode

Set the `USE_TEST_CARDS` environment variable to `true` or `1`:

### Local Development (.env.local)

```env
USE_TEST_CARDS=true
RAIN_API_KEY=your_api_key_here
RAIN_API_BASE_URL=https://api-dev.raincards.xyz/v1
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

### Vercel Deployment

Add the environment variable in Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add `USE_TEST_CARDS` with value `true`
3. Redeploy your application

Or via CLI:

```bash
vercel env add USE_TEST_CARDS
# Enter: true
```

## How It Works

### Card Creation

When `USE_TEST_CARDS=true`:
- `createCard()` returns a mock card with test details
- Card ID is generated as `test_card_{userId}_{timestamp}`
- No API call is made to Rain
- Card is still synced to Convex for consistency

### Card Secrets (PAN/CVC)

When `USE_TEST_CARDS=true`:
- `getCardSecrets()` returns mock encrypted data
- Decryption automatically handles test mode
- Always returns the test card PAN and CVC
- No API call is made to Rain

### MCP Tools

All MCP tools automatically use test mode when enabled:

- `create_virtual_card` - Creates test card
- `get_card_payment_details` - Returns test card PAN/CVC
- Other tools continue to work normally

## Example Usage

### Creating a Test Card

```typescript
import { createCard } from '@/lib/rain-api';

// With USE_TEST_CARDS=true, this returns test card
const card = await createCard('user_123', {
  type: 'virtual',
  status: 'active',
  limit: {
    amount: 10000, // $100.00
    frequency: 'perAuthorization',
  },
});

console.log(card.last4); // Always "6532" in test mode
console.log(card.id); // "test_card_user_123_1234567890"
```

### Getting Test Card Details

```typescript
import { getCardSecrets } from '@/lib/rain-api';
import { decryptSecret } from '@/lib/card-decrypt';
import { generateSessionIdForEnv } from '@/lib/session-id';

const sessionData = generateSessionIdForEnv(false);
const secrets = await getCardSecrets('test_card_123', sessionData.sessionId);

// Decrypt (handles test mode automatically)
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

console.log(pan); // Always "4549240609436532" in test mode
console.log(cvc); // Always "906" in test mode
```

## Production Mode

To disable test mode and use real Rain API:

1. Remove `USE_TEST_CARDS` environment variable, OR
2. Set `USE_TEST_CARDS=false`

The system will automatically use the real Rain API for all card operations.

## Benefits

- **Cost Savings**: No charges for test card creation
- **Fast Development**: No API rate limits during testing
- **Consistent Testing**: Same card details every time
- **Easy Switching**: Toggle with environment variable

## Important Notes

⚠️ **Security**: Test card details are hardcoded and should NEVER be used in production.

⚠️ **Testing**: The test card will work for testing payment flows, but transactions will fail with real payment processors.

✅ **Development**: Perfect for local development, CI/CD testing, and staging environments.

