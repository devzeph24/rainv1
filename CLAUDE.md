# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LedgerOS (rainv1) - A Next.js application that integrates with the Rain Cards API for virtual/physical card issuing, collateral management, and credit solutions. Provides an MCP (Model Context Protocol) server for AI agent access to card operations.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint

# Rain API Scripts (require .env.local)
npm run rain:initiate      # Initiate user application
npm run rain:get-users     # List all users from Rain API
npm run rain:sync-users    # Sync users from Rain API to Convex
npm run rain:create-card   # Create a virtual card
npm run rain:get-cards     # List cards
npm run rain:get-secrets   # Get card PAN/CVC (encrypted)
npm run rain:get-balances  # Get user credit balances
npm run rain:get-contracts # Get user collateral contracts

# Testing
npm run test:mcp-server       # Test MCP server endpoints
npm run test:agent-workflow   # Test full agent card workflow
```

## Architecture

### Core Layers

1. **Rain API Client** (`lib/rain-api.ts`)
   - Wrapper for Rain Cards REST API
   - Handles card creation, user applications, balances, contracts
   - Supports test mode (`USE_TEST_CARDS=true`) with mock responses

2. **MCP Server** (`app/api/mcp/route.ts`)
   - Exposes Rain API operations as MCP tools for AI agents
   - Tools: `create_virtual_card`, `get_card_payment_details`, `get_user_balance`, `update_card_status`, etc.
   - Optional API key authentication via `MCP_API_KEY` env var

3. **Convex Database** (`convex/`)
   - Syncs and caches data from Rain API
   - Tables: `users`, `cards`, `userBalances`, `userContracts`, `userApplications`, `apiKeys`
   - Functions in `convex/*.ts` handle mutations and queries

### Key Patterns

- **Card Secrets Flow**: Card PAN/CVC retrieval uses encrypted session IDs (`lib/session-id.ts`) with RSA-OAEP encryption, then AES-128-GCM decryption (`lib/card-decrypt.ts`)
- **Test Mode**: Set `USE_TEST_CARDS=true` to use mock cards and avoid API costs during development
- **Data Sync**: MCP tools fetch fresh data from Rain API and sync to Convex for caching

### Environment Variables

Required in `.env.local`:
```
RAIN_API_KEY=<your-api-key>
RAIN_API_BASE_URL=https://api-dev.raincards.xyz/v1  # or api.raincards.xyz for prod
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
USE_TEST_CARDS=true  # Enable test mode
MCP_API_KEY=<optional-for-auth>  # MCP endpoint authentication
```

### MCP Tools Available

- `create_virtual_card` - Create card with spending limits
- `get_card_payment_details` - Get decrypted PAN/CVC
- `get_user_balance` - Check credit limits and spending power
- `update_card_status` - Lock/unlock/cancel cards
- `update_card_limit` - Modify spending limits
- `initiate_user_application` - Onboard new users
- `get_user_contracts` / `create_user_contract` - Manage collateral contracts
- `generate_api_key` / `list_api_keys` / `revoke_api_key` - API key management

## File Structure Notes

- `app/api/mcp/route.ts` - Single MCP endpoint handling all tools
- `lib/` - Shared utilities (Rain API client, crypto helpers)
- `convex/` - Database schema and functions
- `scripts/` - CLI scripts for testing and manual operations
