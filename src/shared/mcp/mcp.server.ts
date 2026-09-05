import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerShopeeTools } from '../../modules/shopee/shopee.tool.js';

export const mcpServer = new McpServer({
  name: 'ecommerce-mcp-hub',
  version: '1.0.0',
});

// Registra as tools dos módulos
registerShopeeTools(mcpServer);
