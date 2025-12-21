// Expose the same MCP handler at /mcp for Vercel MCP clients/templates
export { GET, POST, DELETE, OPTIONS } from '../api/mcp/[[...path]]/route';

