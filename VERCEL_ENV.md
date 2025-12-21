# Vercel Environment Variables

This document lists all environment variables that need to be configured in Vercel for deployment.

## Required Secrets

### 1. Rain API Configuration
- **`RAIN_API_KEY`** (Secret)
  - Your Rain Cards API key
  - Get from: https://dashboard.raincards.xyz
  - **Never expose in client-side code**

- **`RAIN_API_BASE_URL`** (Optional)
  - Default: `https://api-dev.raincards.xyz/v1` (sandbox)
  - Production: `https://api.raincards.xyz/v1`
  - Can be left empty to use default

### 2. Convex Configuration
- **`NEXT_PUBLIC_CONVEX_URL`** (Public)
  - Your Convex deployment URL
  - Format: `https://<project>.convex.cloud`
  - Safe to expose (used in client-side code)

- **`CONVEX_DEPLOYMENT`** (Optional - for CLI only)
  - Only needed if using Convex CLI locally
  - Not required in Vercel production

### 3. MCP Server Authentication
- **`MCP_API_KEY`** (Secret)
  - Required in production to authenticate MCP requests
  - Clients use: `Authorization: Bearer <key>` or `X-API-Key: <key>`
  - Clients should also send `Accept: application/json, text/event-stream`

### 4. Test Mode (Optional)
- **`USE_TEST_CARDS`** (Optional)
  - Set to `true` or `1` to enable test card mode
  - Uses mock cards instead of hitting Rain API (saves costs)
  - Default: `false`

## Vercel Setup Instructions

1. Go to your Vercel project settings → Environment Variables

2. Add the following variables:

   **Production:**
   ```
   RAIN_API_KEY=your_production_rain_api_key
   RAIN_API_BASE_URL=https://api.raincards.xyz/v1
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   MCP_API_KEY=your_mcp_api_key
   USE_TEST_CARDS=false (or omit)
   ```

   **Preview/Development:**
   ```
   RAIN_API_KEY=your_sandbox_rain_api_key
   RAIN_API_BASE_URL=https://api-dev.raincards.xyz/v1
   NEXT_PUBLIC_CONVEX_URL=https://your-dev-project.convex.cloud
   MCP_API_KEY= (leave empty for dev)
   USE_TEST_CARDS=true (optional, for testing)
   ```

3. Mark secrets appropriately:
   - ✅ **Encrypted/Secret**: `RAIN_API_KEY`, `MCP_API_KEY`
   - ✅ **Public**: `NEXT_PUBLIC_CONVEX_URL`
   - ✅ **Plain**: `RAIN_API_BASE_URL`, `USE_TEST_CARDS`

## Notes

- **`NEXT_PUBLIC_*`** variables are exposed to the browser - only use for non-sensitive config
- **Never** commit `.env.local` or expose API keys in client-side code
- The MCP server will work without `MCP_API_KEY` set (development mode)
- Test mode (`USE_TEST_CARDS=true`) avoids API costs but returns mock data

## Verification

After deployment, verify your environment variables are set:

```bash
# Check Vercel logs
vercel logs

# Or test the MCP endpoint
curl https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
