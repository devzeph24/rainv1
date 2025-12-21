# Testing Your MCP Server

This guide shows you how to test your MCP server using multiple methods.

## Prerequisites

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Verify environment variables** are set in `.env.local`:
   ```env
   USE_TEST_CARDS=true
   RAIN_API_KEY=your_api_key
   RAIN_API_BASE_URL=https://api-dev.raincards.xyz/v1
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   ```

---

## Method 1: Automated Test Script (Recommended)

Run the comprehensive test suite:

```bash
npm run test:mcp-server
```

This will test:
- ✅ Server connectivity
- ✅ List all available tools
- ✅ User management tools
- ✅ Card creation (with test mode)
- ✅ Card retrieval
- ✅ Payment details

### Test Specific Tool

Test a single tool:

```bash
# Test card creation
TEST_TOOL="create_virtual_card" TEST_USER_ID="your_user_id" TEST_LIMIT_AMOUNT="10000" npm run test:mcp-server

# Test user lookup
TEST_TOOL="get_user_by_email" TEST_EMAIL="user@example.com" npm run test:mcp-server

# Test balance check
TEST_TOOL="get_user_balance" TEST_USER_ID="your_user_id" npm run test:mcp-server
```

---

## Method 2: MCP Inspector (Visual Testing)

The MCP Inspector provides a visual interface to test your tools.

### Install Inspector

```bash
npx @modelcontextprotocol/inspector@latest
```

### Connect to Your Server

1. Open the inspector (usually at `http://127.0.0.1:6274`)
2. Select **Streamable HTTP** from the transport dropdown
3. Enter URL: `http://localhost:3000/api/mcp`
4. Click **Connect**

### Test Tools

1. Click **List Tools** to see all available tools
2. Click on any tool to test it
3. Fill in the parameters in the right panel
4. Click **Execute** to run the tool

---

## Method 3: Direct HTTP Testing

Test the MCP server directly with curl:

### List Available Tools

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Call a Tool

```bash
# Create a virtual card
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_virtual_card",
      "arguments": {
        "userId": "your_user_id",
        "limitAmount": 10000,
        "limitFrequency": "perAuthorization"
      }
    }
  }'
```

### Get Card Payment Details

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_card_payment_details",
      "arguments": {
        "cardId": "your_card_id",
        "userId": "your_user_id"
      }
    }
  }'
```

---

## Method 4: Using Cursor/Claude Desktop

### Configure MCP Client

Add to your MCP configuration (`.cursor/mcp.json` or Claude Desktop config):

```json
{
  "mcpServers": {
    "rain-cards": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

### Test in Chat

Ask your AI assistant:
- "Create a virtual card for user X with a $100 limit"
- "Get the payment details for card Y"
- "Check the balance for user X"

---

## Test Scenarios

### Scenario 1: Complete Purchase Flow

```bash
# 1. Check balance
TEST_TOOL="get_user_balance" TEST_USER_ID="user_123" npm run test:mcp-server

# 2. Create card
TEST_TOOL="create_virtual_card" TEST_USER_ID="user_123" TEST_LIMIT_AMOUNT="5000" npm run test:mcp-server

# 3. Get payment details (save cardId from step 2)
TEST_TOOL="get_card_payment_details" TEST_CARD_ID="card_123" TEST_USER_ID="user_123" npm run test:mcp-server

# 4. Lock card after purchase
TEST_TOOL="update_card_status" TEST_CARD_ID="card_123" npm run test:mcp-server
# Use status: "locked"
```

### Scenario 2: User Onboarding

```bash
# 1. Create application
TEST_TOOL="initiate_user_application" npm run test:mcp-server
# Use: firstName="John", lastName="Doe", email="john@example.com"

# 2. Find user by email
TEST_TOOL="get_user_by_email" TEST_EMAIL="john@example.com" npm run test:mcp-server

# 3. Check if approved
TEST_TOOL="get_user_by_id" TEST_USER_ID="user_123" npm run test:mcp-server
```

---

## Troubleshooting

### Server Not Running

**Error**: `MCP server is not accessible`

**Solution**:
```bash
npm run dev
```

### Environment Variables Missing

**Error**: `RAIN_API_KEY is not defined`

**Solution**: Create `.env.local` with required variables

### Convex Connection Issues

**Error**: `NEXT_PUBLIC_CONVEX_URL is not defined`

**Solution**: Add your Convex URL to `.env.local`

### Test Mode Not Working

**Error**: Real cards being created instead of test cards

**Solution**: Ensure `USE_TEST_CARDS=true` in `.env.local`

---

## Expected Results

### With Test Mode Enabled (`USE_TEST_CARDS=true`)

- ✅ Card creation returns test card: `4549240609436532`
- ✅ Payment details return test PAN/CVC
- ✅ No API costs incurred
- ✅ Consistent test data

### Without Test Mode

- ✅ Real cards created via Rain API
- ✅ Real payment details retrieved
- ✅ Data synced to Convex
- ⚠️ API costs apply

---

## Quick Test Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Environment variables set
- [ ] Test script runs successfully (`npm run test:mcp-server`)
- [ ] MCP Inspector can connect
- [ ] Tools return expected results
- [ ] Test mode working (if enabled)

---

## Next Steps

After testing:
1. ✅ Verify all tools work correctly
2. ✅ Test error handling
3. ✅ Test with real data (disable test mode)
4. ✅ Deploy to Vercel
5. ✅ Test production endpoint

