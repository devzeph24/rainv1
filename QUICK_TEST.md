# Quick Test Guide

## ✅ Server Status

Your dev server should be running. Check with:
```bash
lsof -ti:3000
```

If nothing shows, start it:
```bash
npm run dev
```

---

## 🧪 Test Methods

### Method 1: Automated Test Script (Easiest)

```bash
npm run test:mcp-server
```

This will:
- ✅ Check server connectivity
- ✅ List all 16 tools
- ✅ Test user creation
- ✅ Test card creation (with test mode)
- ✅ Test card retrieval

---

### Method 2: MCP Inspector (Visual)

1. **Install inspector**:
   ```bash
   npx @modelcontextprotocol/inspector@latest
   ```

2. **Open browser** to `http://127.0.0.1:6274`

3. **Connect**:
   - Select: **Streamable HTTP**
   - URL: `http://localhost:3000/mcp` (or `/api/mcp`)
   - Click **Connect**

4. **Test tools**:
   - Click **List Tools** to see all 16 tools
   - Click any tool to test it
   - Fill parameters and click **Execute**

---

### Method 3: Quick curl Test

**List all tools**:
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

**Test create_virtual_card** (with test mode):
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_virtual_card",
      "arguments": {
        "userId": "test-user-123",
        "limitAmount": 10000,
        "limitFrequency": "perAuthorization"
      }
    }
  }' | jq
```

**Expected result** (with `USE_TEST_CARDS=true`):
- Card created with test card details
- `last4: "6532"`
- `testMode: true`

---

## 🎯 Test Checklist

- [ ] Server running (`npm run dev`)
- [ ] Environment variables set (`.env.local`)
- [ ] `USE_TEST_CARDS=true` (for safe testing)
- [ ] Test script runs (`npm run test:mcp-server`)
- [ ] Can list tools via curl or inspector
- [ ] Can create test card
- [ ] Can retrieve card payment details

---

## 🐛 Troubleshooting

**404 Error**: Ensure routes exist at `app/api/mcp/[[...path]]/route.ts` and/or `app/mcp/route.ts`. Prefer calling `/mcp`.

**Connection Refused**: Start dev server with `npm run dev`

**Environment Errors**: Check `.env.local` has all required vars

**Test Mode Not Working**: Verify `USE_TEST_CARDS=true` in `.env.local`

---

## 📊 Expected Test Results

With `USE_TEST_CARDS=true`:
- ✅ All card operations return test card: `4549240609436532`
- ✅ No API costs
- ✅ Consistent test data
- ✅ Fast responses

---

## 🚀 Next Steps

1. Run automated tests: `npm run test:mcp-server`
2. Try MCP Inspector for visual testing
3. Test specific workflows (see TESTING.md)
4. Deploy to Vercel when ready
