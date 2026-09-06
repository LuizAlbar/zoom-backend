import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ShopeeService } from './shopee.service.js';

export function registerShopeeTools(mcpServer: McpServer) {
  const service = new ShopeeService();

  mcpServer.registerTool(
    'search_shopee_products',
    {
      description: 'Busca produtos no marketplace da Shopee retornando título, preço, preço numérico, comissão e link de compra.',
      inputSchema: {
        keyword: z.string().describe('Nome ou termo de busca do produto (ex: mouse sem fio, camiseta)'),
        limit: z.number().optional().default(5).describe('Quantidade de itens a retornar (máximo 20)'),
        min_price: z.number().optional().describe('Preço mínimo do produto em Reais (BRL)'),
        max_price: z.number().optional().describe('Preço máximo do produto em Reais (BRL)'),
        sort_by: z.enum(['relevance', 'price_asc', 'price_desc', 'sales_desc'])
          .optional()
          .default('relevance')
          .describe('Critério de ordenação dos resultados: relevance, price_asc, price_desc, sales_desc'),
      }
    },
    async ({ keyword, limit, min_price, max_price, sort_by }) => {
      try {
        const items = await service.searchAndFormat({
          keyword,
          limit,
          min_price,
          max_price,
          sort_by,
        });

        if (!items.length) {
          return {
            content: [{ type: 'text', text: `Nenhum produto encontrado na Shopee para os critérios informados.` }],
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
