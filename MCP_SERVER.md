# MCP Server for Rain Cards

This project includes an MCP (Model Context Protocol) server that provides access to your Rain Cards data stored in Convex.

## Setup

The MCP server is already configured and ready to use. It's located at:
- **Routes**: `app/api/mcp/[[...path]]/route.ts` and `app/mcp/route.ts`
- **Endpoints**:
  - Preferred: `http://localhost:3000/mcp` (local) or `https://your-app.vercel.app/mcp` (production)
  - Also available: `http://localhost:3000/api/mcp` or `https://your-app.vercel.app/api/mcp`

Important: Clients must send header `Accept: application/json, text/event-stream` in addition to `Content-Type: application/json`.

## Available Tools

The MCP server provides the following tools to interact with your Convex database:

### User Tools
- **`get_user_by_id`** - Get a user by their Rain user ID
- **`list_users`** - List all users in the database
- **`get_user_by_email`** - Get users by email address
- **`get_users_by_status`** - Get users filtered by application status

### Card Tools
- **`get_user_cards`** - Get all cards for a specific user
- **`get_card_by_id`** - Get a card by its Rain card ID
- **`list_cards`** - List all cards in the database

### Financial Tools
- **`get_user_balances`** - Get balance and credit limit information for a user
- **`get_user_contracts`** - Get collateral contracts for a user

## Testing Locally

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. Use curl to sanity check tools list:
   ```bash
   curl -X POST http://localhost:3000/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```

5. **Test the tools:**
   - Click **List Tools** to see all available tools
   - Click on any tool to test it
   - Use the right panel to provide parameters and execute

## Configuring Cursor

To use this MCP server in Cursor, add it to your MCP configuration (Streamable HTTP):

**`.cursor/mcp.json`** (create if it doesn't exist):
```json
{
  "mcpServers": {
    "ledgeros-v1": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

For production (after deploying to Vercel):
```json
{
  "mcpServers": {
    "ledgeros-v1": {
      "type": "http",
      "url": "https://your-app.vercel.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

## Environment Variables

Make sure your `.env.local` includes:
- `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL

## Architecture

```
┌─────────────────┐
│   MCP Server    │  ← Next.js API Route (Vercel)
│   (Vercel)      │
└────────┬────────┘
         │
         │ Convex HTTP Client
         ▼
┌─────────────────┐
│  Convex Backend │  ← Your database (users, cards, balances, contracts)
│  (Cloud)        │
└─────────────────┘
```

The MCP server acts as a bridge between MCP clients (like Cursor) and your Convex database, providing a standardized interface to query your Rain Cards data.

## Deployment

When you deploy to Vercel, the MCP server will be available at:
`https://your-app.vercel.app/mcp` (preferred) and `https://your-app.vercel.app/api/mcp`.

Notes:
- The server requires `Accept: application/json, text/event-stream` in requests.
- We default to Streamable HTTP transport. To enable SSE on Vercel, configure `REDIS_URL` and toggle the handler to use SSE per `mcp-handler` docs.
