# MCP Server for Rain Cards

This project includes an MCP (Model Context Protocol) server that provides access to your Rain Cards data stored in Convex.

## Setup

The MCP server is already configured and ready to use. It's located at:
- **Route**: `/app/api/mcp/route.ts`
- **Endpoint**: `http://localhost:3000/api/mcp` (local) or `https://your-app.vercel.app/api/mcp` (production)

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

2. **Run the MCP inspector:**
   ```bash
   npx @modelcontextprotocol/inspector@latest http://localhost:3000
   ```

3. **Open the inspector interface:**
   - Browse to `http://127.0.0.1:6274`

4. **Connect to your MCP server:**
   - Select **Streamable HTTP** in the dropdown
   - Enter URL: `http://localhost:3000/api/mcp`
   - Click **Connect**

5. **Test the tools:**
   - Click **List Tools** to see all available tools
   - Click on any tool to test it
   - Use the right panel to provide parameters and execute

## Configuring Cursor

To use this MCP server in Cursor, add it to your MCP configuration:

**`.cursor/mcp.json`** (create if it doesn't exist):
```json
{
  "mcpServers": {
    "rain-cards": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

For production (after deploying to Vercel):
```json
{
  "mcpServers": {
    "rain-cards": {
      "url": "https://your-app.vercel.app/api/mcp"
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

When you deploy to Vercel, the MCP server will automatically be available at:
`https://your-app.vercel.app/api/mcp`

No additional configuration needed - Vercel will handle the serverless function deployment automatically.

