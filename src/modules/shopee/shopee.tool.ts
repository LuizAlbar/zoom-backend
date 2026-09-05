import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ShopeeService } from './shopee.service.js';

export function registerShopeeTools(mcpServer: McpServer) {
  const service = new ShopeeService();

  mcpServer.tool(
    'search_shopee_products',
    'Busca produtos no marketplace da Shopee retornando título, preço e link de compra.',
    {
      keyword: z.string().describe('Nome ou termo de busca do produto (ex: mouse sem fio, camiseta)'),
      limit: z.number().optional().default(5).describe('Quantidade de itens a retornar (máximo 20)'),
    },
    async ({ keyword, limit }) => {
      try {
        const items = await service.searchAndFormat(keyword, limit);

        if (!items.length) {
          return {
            content: [{ type: 'text', text: `Nenhum produto encontrado na Shopee para: "${keyword}".` }],
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Erro na busca Shopee: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
