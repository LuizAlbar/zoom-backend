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

  mcpServer.registerTool(
    'generate_affiliate_link',
    {
      description: 'Transforma um link normal de produto ou página da Shopee (copiado da web pelo usuário) em um link de afiliado curto e comissionado com sub_id para rastreamento de vendas.',
      inputSchema: {
        original_url: z.string().url().describe('A URL original completa do produto ou página da Shopee a ser convertida.'),
        sub_id: z.string().max(50).optional().describe('Identificador opcional de rastreamento de campanha (max 50 caracteres).'),
      }
    },
    async ({ original_url, sub_id }) => {
      try {
        const result = await service.generateAffiliateLink({ original_url, sub_id });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Erro na geração de link afiliado Shopee: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  mcpServer.registerTool(
    'analyze_affiliate_product_link',
    {
      description: 'Analisa e inspeciona um link de produto da Shopee (comum ou encurtado) para verificar viabilidade financeira, calcular estimativa de comissão em Reais, obter fotos, estatísticas e gerar o link encurtado de afiliado comissionado.',
      inputSchema: {
        url: z.string().url().describe('A URL completa do produto (or link curto s.shopee.com.br / shope.ee) a ser analisado.'),
        sub_id: z.string().max(50).optional().describe('Identificador opcional de rastreamento de campanha (max 50 caracteres).'),
      }
    },
    async ({ url, sub_id }) => {
      try {
        const result = await service.analyzeProductLink({ url, sub_id });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Erro na análise do link do produto Shopee: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  mcpServer.registerTool(
    'build_bundle_by_budget',
    {
      description: 'Monta um kit otimizado de produtos selecionando exatamente um item para cada termo/categoria solicitado (ex: ["mousepad grande", "suporte headset"]) de modo que a soma total respeite o orçamento máximo estipulado.',
      inputSchema: {
        items: z.array(z.string().min(2)).min(2).max(6).describe('Lista de categorias ou nomes dos produtos que devem compor o kit (mínimo 2, máximo 6).'),
        max_total_budget: z.number().positive().describe('O limite máximo de orçamento em Reais (BRL) para o valor somado de todos os itens do kit.'),
      }
    },
    async ({ items, max_total_budget }) => {
      try {
        const result = await service.buildBundleByBudget({ items, max_total_budget });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Erro na montagem do kit por orçamento: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
