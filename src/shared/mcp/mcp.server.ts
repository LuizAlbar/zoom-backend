import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerShopeeTools } from '../../modules/shopee/shopee.tool.js';
import { registerMagaluTools } from '../../modules/magalu/magalu.tool.js';

export function createMcpServer() {
  const mcpServer = new McpServer({
    name: 'ecommerce-mcp-hub',
    version: '1.0.0',
  });

  // Registra as tools dos módulos
  registerShopeeTools(mcpServer);
  registerMagaluTools(mcpServer);

  return mcpServer;
}
