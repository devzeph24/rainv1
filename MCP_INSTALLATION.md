# LedgerOS v1 MCP Server Installation Guide

This guide explains how to install and use the LedgerOS v1 MCP (Model Context Protocol) server.

## What is LedgerOS v1?

LedgerOS v1 is an MCP server that provides tools for managing Rain Cards, users, balances, and contracts. It integrates with the Rain Cards API and Convex database.

## Installation

### Option 1: Direct HTTP/SSE Connection

Connect directly to the MCP server endpoint:

**URL:** `https://your-app.vercel.app/api/mcp` (production) or `http://localhost:3000/api/mcp` (development)

**Transport:** HTTP POST with Server-Sent Events (SSE) support

### Option 2: Using MCP-Compatible Clients

#### Claude Desktop / Cursor

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "ledgeros-v1": {
      "url": "https://your-app.vercel.app/api/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}
```

#### Custom Integration

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient({
  name: 'ledgeros-v1',
  version: '1.0.0',
});

await client.connect({
  transport: {
    type: 'sse',
    url: 'https://your-app.vercel.app/api/mcp',
    headers: {
      'Authorization': 'Bearer YOUR_MCP_API_KEY',
      'Accept': 'application/json, text/event-stream',
    },
  },
});
```

## Authentication

### Server-Level Authentication (Optional)

If `MCP_API_KEY` is set in the server environment:

```bash
# Using Authorization header
curl -H "Authorization: Bearer YOUR_MCP_API_KEY" ...

# Using X-API-Key header
curl -H "X-API-Key: YOUR_MCP_API_KEY" ...
```

**Note:** If `MCP_API_KEY` is not set, the server runs in development mode (no auth required).

### User-Level API Keys

For production use, generate user-specific API keys:

```bash
# Generate a key for a user
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer YOUR_MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate_api_key",
      "arguments": {
        "userId": "user-123",
        "name": "My API Key"
      }
    }
  }'
```

## Available Tools

The server provides 19 tools:

### User Management
- `initiate_user_application` - Create a new user application
- `get_user_by_id` - Get user by Rain user ID
- `get_user_by_email` - Find users by email
- `list_users` - List all users
- `get_user_balance` - Get user balance and credit info

### Card Management
- `create_virtual_card` - Create a virtual card
- `get_card_payment_details` - Get card PAN and CVC
- `get_user_cards` - Get all cards for a user
- `get_card_details` - Get card details
- `update_card_status` - Update card status
- `update_card_limit` - Update spending limits
- `get_card_from_rain` - Get fresh card data from Rain API
- `list_all_cards` - List all cards

### Contracts
- `get_user_contracts` - Get user collateral contracts
- `create_user_contract` - Create a collateral contract

### API Key Management
- `generate_api_key` - Generate a new API key for a user
- `list_api_keys` - List user's API keys
- `revoke_api_key` - Revoke an API key

## Example Usage

### 1. Initialize Connection

```bash
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "my-client",
        "version": "1.0.0"
      }
    }
  }'
```

### 2. List Available Tools

```bash
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### 3. Create a Virtual Card

```bash
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer YOUR_MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_virtual_card",
      "arguments": {
        "userId": "user-123",
        "limitAmount": 10000,
        "limitFrequency": "perAuthorization",
        "displayName": "Shopping Card"
      }
    }
  }'
```

### 4. Get Card Payment Details

```bash
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer YOUR_MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_card_payment_details",
      "arguments": {
        "cardId": "card-123",
        "userId": "user-123"
      }
    }
  }'
```

## Response Format

Responses use Server-Sent Events (SSE) format:

```
event: message
data: {"jsonrpc":"2.0","result":{...},"id":1}
```

Parse the `data:` line to extract the JSON response.

## Error Handling

Errors are returned in JSON-RPC format:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Error description"
  },
  "id": 1
}
```

Common error codes:
- `-32000`: General error
- `-32001`: Unauthorized (invalid API key)
- `-32600`: Invalid Request
- `-32601`: Method not found

## Security Best Practices

1. **Use HTTPS in production** - Never expose API keys over HTTP
2. **Rotate API keys regularly** - Revoke old keys and generate new ones
3. **Use user-specific API keys** - Don't share the server-level MCP_API_KEY
4. **Set expiration dates** - Use `expiresInDays` when generating keys
5. **Monitor key usage** - Check `lastUsedAt` timestamps regularly

## Support

For issues or questions:
- Check the [Rain API Documentation](https://docs.raincards.xyz)
- Review server logs in Vercel dashboard
- Contact: platform@raincards.xyz

