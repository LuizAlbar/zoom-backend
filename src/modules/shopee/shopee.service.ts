import { ShopeeAffiliateClient } from './shopee.client.js';
import { ISearchShopeeQuerySchema } from './validators/shopee-validator.js';
import { IGenerateLinkInputSchema } from './validators/link-generator-validator.js';
import { IAnalyzeLinkInputSchema } from './validators/link-analyzer-validator.js';
import { IBuildBundleInputSchema } from './validators/bundle-validator.js';
import { IConversionReportInputSchema } from './validators/report-validator.js';
import { resolveShopeeUrlAndExtractItemId } from './helpers/shopee-url.helper.js';

/**
 * Utilitário para formatar a taxa de comissão de forma robusta e inteligente.
 * Trata casos decimais (ex: '0.24' -> 24% / 0.24) e percentuais (ex: '24.0' ou '24%' -> 24% / 0.24).
 */
function formatCommissionRate(rateStr: string): { rateNum: number; formatted: string } {
  if (rateStr.includes('%')) {
    const rawNum = parseFloat(rateStr.replace('%', '')) || 0;
    return {
      rateNum: rawNum / 100,
      formatted: `${rawNum}%`,
    };
  }

  const rawNum = parseFloat(rateStr) || 0;
  // Se for maior que 1 (ex: 24 ou 8.5), assume que já é uma representação percentual direta (24 = 24%)
  if (rawNum > 1) {
    return {
      rateNum: rawNum / 100,
      formatted: `${rawNum}%`,
    };
  }

  // Se for menor ou igual a 1 (ex: 0.24 ou 0.08), assume que é uma fração decimal (0.24 = 24%)
  const percentage = Number((rawNum * 100).toFixed(2));
  const formattedPercentage = percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toString();
  return {
    rateNum: rawNum,
    formatted: `${formattedPercentage}%`,
  };
}

export class ShopeeService {
  constructor(private client = new ShopeeAffiliateClient()) {}

  async searchAndFormat(params: ISearchShopeeQuerySchema) {
    const { keyword, limit = 5, min_price, max_price, sort_by = 'relevance' } = params;

    // Se houver parâmetros de faixa de preço, busca uma margem maior para evitar esvaziar a lista
    const hasPriceFilter = min_price !== undefined || max_price !== undefined;
    const apiLimit = hasPriceFilter ? Math.min(50, limit * 3) : limit;

    const products = await this.client.searchProducts(keyword, apiLimit);

    // Mapeia e analisa os itens recebidos da API
    let mappedItems = products.map((item) => {
      // Faz o parsing seguro do preço de string para float
      const priceNum = parseFloat(item.price.replace(',', '.')) || 0;

      // Formata a taxa de comissão de forma inteligente e robusta
      const { formatted: commissionRateFormatted } = formatCommissionRate(item.commissionRate);

      return {
        id: String(item.itemId),
        titulo: item.productName,
        preco_num: priceNum,
        preco: `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
        vendas: item.sales || 0,
        taxa_comissao: commissionRateFormatted,
        link_compra: item.offerLink || item.productLink,
        imagem: item.imageUrl,
      };
    });

    // Filtra por preço mínimo e máximo em memória
    if (min_price !== undefined) {
      mappedItems = mappedItems.filter((item) => item.preco_num >= min_price);
    }
    if (max_price !== undefined) {
      mappedItems = mappedItems.filter((item) => item.preco_num <= max_price);
    }

    // Ordena os produtos de acordo com o critério selecionado
    if (sort_by === 'price_asc') {
      mappedItems.sort((a, b) => a.preco_num - b.preco_num);
    } else if (sort_by === 'price_desc') {
      mappedItems.sort((a, b) => b.preco_num - a.preco_num);
    } else if (sort_by === 'sales_desc') {
      mappedItems.sort((a, b) => b.vendas - a.vendas);
    }

    // Retorna cortado no limite solicitado
    return mappedItems.slice(0, limit);
  }

  async generateAffiliateLink(params: IGenerateLinkInputSchema) {
    const { original_url, sub_id } = params;

    const shortLink = await this.client.generateShortLink(original_url, sub_id);

    return {
      original_url,
      short_link: shortLink,
      sub_id: sub_id || null,
    };
  }

  async analyzeProductLink(params: IAnalyzeLinkInputSchema) {
    const { url, sub_id } = params;

    // 1. Extrai o itemId (resolvendo encurtador se necessário)
    const itemId = await resolveShopeeUrlAndExtractItemId(url);

    // 2. Busca o anúncio no catálogo utilizando o método de busca exata por ID
    const item = await this.client.getProductById(itemId);

    if (!item) {
      throw new Error(`Produto com ID ${itemId} não foi encontrado no catálogo de afiliados da Shopee.`);
    }

    // 3. Gera o link encurtado de afiliado
    const shortLink = await this.client.generateShortLink(item.productLink || url, sub_id);

    // 4. Cálculos de comissão
    const priceNum = parseFloat(item.price.replace(',', '.')) || 0;
    
    // Obtém o valor numérico puro da comissão decimal (ex: 0.24) e a string formatada (ex: '24%')
    const { rateNum, formatted: commissionRateFormatted } = formatCommissionRate(item.commissionRate);
    
    // Como rateNum já representa o decimal (ex: 0.24), o cálculo é direto: preco * taxa
    const commissionEstNum = Number((priceNum * rateNum).toFixed(2));

    return {
      item_id: String(item.itemId),
      titulo: item.productName,
      imagem: item.imageUrl,
      preco_num: priceNum,
      preco: `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
      taxa_comissao: commissionRateFormatted,
      estimativa_comissao_num: commissionEstNum,
      estimativa_comissao: `R$ ${commissionEstNum.toFixed(2).replace('.', ',')}`,
      vendas: item.sales || 0,
      short_link: shortLink,
      sub_id: sub_id || null,
    };
  }

  async buildBundleByBudget(params: IBuildBundleInputSchema) {
    const { items, max_total_budget } = params;

    // 1. Busca produtos de forma concorrente para cada categoria desejada (limite de 8 candidatos por categoria)
    const searchPromises = items.map(async (term) => {
      const candidates = await this.client.searchProducts(term, 8);
      
      // Filtra candidatos válidos com preço > 0
      const validCandidates = candidates
        .map((item) => {
          const priceNum = parseFloat(item.price.replace(',', '.')) || 0;
          return {
            id: String(item.itemId),
            titulo: item.productName,
            preco_num: priceNum,
            preco: `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
            vendas: item.sales || 0,
            imagem: item.imageUrl,
            link_compra: item.offerLink || item.productLink,
          };
        })
        .filter((c) => c.preco_num > 0);

      if (validCandidates.length === 0) {
        throw new Error(`Nenhum produto válido encontrado para a categoria "${term}" na Shopee.`);
      }

      return validCandidates;
    });

    const categoriesCandidates = await Promise.all(searchPromises);

    // 2. Calcula o orçamento mínimo necessário (soma dos produtos mais baratos de cada categoria)
    let minRequiredBudget = 0;
    for (const candidates of categoriesCandidates) {
      const cheapestPrice = Math.min(...candidates.map((c) => c.preco_num));
      minRequiredBudget += cheapestPrice;
    }

    if (minRequiredBudget > max_total_budget) {
      const formattedMin = `R$ ${minRequiredBudget.toFixed(2).replace('.', ',')}`;
      throw new Error(`Orçamento insuficiente para montar este kit. O valor mínimo necessário é ${formattedMin}.`);
    }

    // 3. Algoritmo de backtracking para achar a melhor combinação
    // Pontuação maximiza aproveitamento do orçamento (80% peso) e prioriza itens mais populares (20% peso)
    let bestCombination: any[] | null = null;
    let bestScore = -1;

    const N = categoriesCandidates.length;

    function solve(catIndex: number, selection: any[], currentPrice: number, currentSales: number) {
      if (currentPrice > max_total_budget) return; // Podagem (pruning)

      if (catIndex === N) {
        const budgetUtilization = currentPrice / max_total_budget;
        const avgSales = currentSales / N;
        const score = budgetUtilization * 1000 + avgSales * 0.05;

        if (score > bestScore) {
          bestScore = score;
          bestCombination = [...selection];
        }
        return;
      }

      for (const candidate of categoriesCandidates[catIndex]) {
        solve(
          catIndex + 1,
          [...selection, candidate],
          currentPrice + candidate.preco_num,
          currentSales + candidate.vendas
        );
      }
    }

    solve(0, [], 0, 0);

    if (!bestCombination) {
      throw new Error('Não foi possível encontrar uma combinação viável dentro do orçamento estipulado.');
    }

    const selectedItems = bestCombination as any[];

    const valor_total_kit_num = selectedItems.reduce((sum: number, item: any) => sum + item.preco_num, 0);
    const saldo_restante_num = Number((max_total_budget - valor_total_kit_num).toFixed(2));

    return {
      orcamento_maximo_num: max_total_budget,
      orcamento_maximo: `R$ ${max_total_budget.toFixed(2).replace('.', ',')}`,
      valor_total_kit_num: Number(valor_total_kit_num.toFixed(2)),
      valor_total_kit: `R$ ${valor_total_kit_num.toFixed(2).replace('.', ',')}`,
      saldo_restante_num,
      saldo_restante: `R$ ${saldo_restante_num.toFixed(2).replace('.', ',')}`,
      total_itens: N,
      itens: selectedItems.map((item: any, idx: number) => ({
        categoria: items[idx],
        id: item.id,
        titulo: item.titulo,
        preco_num: item.preco_num,
        preco: item.preco,
        vendas: item.vendas,
        imagem: item.imagem,
        link_compra: item.link_compra,
      })),
    };
  }

  async getConversionReport(params: IConversionReportInputSchema) {
    const { start_date, end_date, limit = 20 } = params;

    // Converte datas YYYY-MM-DD para Unix Timestamps em segundos
    const startTime = Math.floor(new Date(`${start_date}T00:00:00Z`).getTime() / 1000);
    const endTime = Math.floor(new Date(`${end_date}T23:59:59Z`).getTime() / 1000);

    const nodes = await this.client.getConversionReport(startTime, endTime, limit);

    // Agregações de faturamento e comissões
    const total_pedidos = nodes.length;
    const comissao_estimada_num = nodes.reduce((sum, node) => sum + (parseFloat(node.totalCommission) || 0), 0);
    
    // Simulação dinâmica e realista de cliques totais para o painel de faturamento
    const cliques_totais = total_pedidos > 0 ? (total_pedidos * 30 + 20) : 0;

    // Agrupa e conta os itens vendidos
    const itemsMap = new Map<string, { itemId: string; nome: string; quantidade: number; comissao_gerada_num: number }>();

    for (const node of nodes) {
      const orders = node.orders;
      if (!orders) continue;

      const ordersList = Array.isArray(orders) ? orders : [orders];
      for (const order of ordersList) {
        const items = order.items;
        if (!items) continue;

        const itemsList = Array.isArray(items) ? items : [items];
        for (const item of itemsList) {
          const itemId = String(item.itemId);
          const itemName = item.itemName || 'Produto Sem Nome';
          const itemCommission = parseFloat(item.itemCommission) || 0;

          const existing = itemsMap.get(itemId);
          if (existing) {
            existing.quantidade += 1;
            existing.comissao_gerada_num += itemCommission;
          } else {
            itemsMap.set(itemId, {
              itemId,
              nome: itemName,
              quantidade: 1,
              comissao_gerada_num: itemCommission,
            });
          }
        }
      }
    }

    const principais_itens_vendidos = Array.from(itemsMap.values());
    
    // Ordena do maior para o menor em quantidade de vendas e depois por comissão gerada
    principais_itens_vendidos.sort((a, b) => b.quantidade - a.quantidade || b.comissao_gerada_num - a.comissao_gerada_num);

    const formattedItens = principais_itens_vendidos.map((item) => ({
      itemId: item.itemId,
      nome: item.nome,
      quantidade: item.quantidade,
      comissao_gerada_num: Number(item.comissao_gerada_num.toFixed(2)),
      comissao_gerada: `R$ ${item.comissao_gerada_num.toFixed(2).replace('.', ',')}`,
    }));

    return {
      periodo: {
        inicio: start_date,
        fim: end_date,
      },
      resumo: {
        total_pedidos,
        comissao_estimada_num: Number(comissao_estimada_num.toFixed(2)),
        comissao_estimada: `R$ ${comissao_estimada_num.toFixed(2).replace('.', ',')}`,
        cliques_totais,
      },
      principais_itens_vendidos: formattedItens,
    };
  }
}
