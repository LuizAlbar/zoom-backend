import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MagaluService } from './magalu.service.js';

export function registerMagaluTools(mcpServer: McpServer) {
  const service = new MagaluService();

  mcpServer.tool(
    'search_magalu_products',
    'Busca produtos no catálogo do Magazine Luiza (Magalu) retornando título, preço e link de compra.',
    {
      keyword: z.string().describe('Nome ou termo de busca do produto (ex: notebook, smartphone, fone)'),
      limit: z.number().optional().default(5).describe('Quantidade de itens a retornar (máximo 20)'),
    },
    async ({ keyword, limit }) => {
      try {
        const items = await service.searchAndFormat(keyword, limit);

        if (!items.length) {
          return {
            content: [{ type: 'text', text: `Nenhum produto encontrado no Magalu para: "${keyword}".` }],
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Erro na busca Magalu: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
