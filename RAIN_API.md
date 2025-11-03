# Rain API Integration

This project integrates with the [Rain Cards API](https://api.raincards.xyz) for card issuing, transaction management, and collateralized credit solutions.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

The Rain API key and configuration are stored in `.env.local`. This file is already configured with your sandbox API key:

```env
RAIN_API_KEY=43250b08c839acc456fe8a036ca210ce0ff5d001
RAIN_API_BASE_URL=https://api-dev.raincards.xyz/v1
```

**Important Security Notes:**
- ⚠️ **NEVER** expose API keys in client-side code (JavaScript, mobile apps, etc.)
- ⚠️ API keys should only be used in server-side code (API routes, server components, scripts)
- The `.env.local` file is automatically ignored by git

### 3. Switch to Production

When ready for production:
1. Create a production API key in the [Rain Dashboard](https://dashboard.raincards.xyz)
2. Update `.env.local`:
   ```env
   RAIN_API_KEY=your_production_key
   RAIN_API_BASE_URL=https://api.raincards.xyz/v1
   ```

## Usage

### Running the Application Initiation Script

Test the API integration by initiating a user application:

```bash
npm run rain:initiate
```

Or with custom user data:

```bash
FIRST_NAME="John" LAST_NAME="Doe" EMAIL="john@example.com" npm run rain:initiate
```

With wallet address:

```bash
FIRST_NAME="Jane" LAST_NAME="Smith" EMAIL="jane@example.com" WALLET_ADDRESS="0x123..." npm run rain:initiate
```

### Using the Rain API Client in Your Code

The Rain API client is available in `lib/rain-api.ts`. Here's how to use it:

#### In Server Components (Next.js App Router)

```typescript
import { initiateUserApplication } from '@/lib/rain-api';

export default async function Page() {
  const application = await initiateUserApplication({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    walletAddress: '0x123...', // optional
  });

  return <div>Application ID: {application.id}</div>;
}
```

#### In API Routes

```typescript
// app/api/applications/route.ts
import { NextResponse } from 'next/server';
import { initiateUserApplication } from '@/lib/rain-api';

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const application = await initiateUserApplication({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      walletAddress: body.walletAddress,
    });

    return NextResponse.json(application);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initiate application' },
      { status: 500 }
    );
  }
}
```

## API Reference

### `initiateUserApplication(data)`

Initiates a consumer application for a user.

**Parameters:**
- `data.firstName` (string, required): User's first name (max 50 characters)
- `data.lastName` (string, required): User's last name (max 50 characters)
- `data.email` (string, required): User's email address
- `data.walletAddress` (string, optional): User's wallet address

**Returns:**
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isTermsOfServiceAccepted: boolean;
  applicationStatus: 'approved' | 'pending' | 'needsInformation' | 'needsVerification' | 'manualReview' | 'denied' | 'locked' | 'canceled';
  companyId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phoneCountryCode?: string;
  phoneNumber?: string;
  applicationCompletionLink?: {
    url: string;
    params?: Record<string, string>;
  };
  applicationReason?: string;
}
```

## Rate Limits

The API enforces rate limits to prevent abuse. If you exceed the limit, you'll receive a `429 Too Many Requests` response. Contact your account manager if you need higher rate limits.

## Error Handling

All API methods throw errors with descriptive messages. Always wrap API calls in try-catch blocks:

```typescript
try {
  const application = await initiateUserApplication(data);
  // Handle success
} catch (error) {
  console.error('Rain API error:', error);
  // Handle error
}
```

## Resources

- [Rain API Documentation](https://docs.raincards.xyz)
- [Rain Dashboard](https://dashboard.raincards.xyz)
- Support: platform@raincards.xyz

## Files Structure

```
/Users/solarium/rainv1/
├── .env.local              # Environment variables (not committed)
├── .env.example            # Example environment file
├── lib/
│   └── rain-api.ts         # Rain API client library
├── scripts/
│   └── initiate-application.ts  # Test script for API
└── RAIN_API.md             # This documentation
```

