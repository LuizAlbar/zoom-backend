import { ShopeeAffiliateClient } from './shopee.client.js';
import { ISearchShopeeQuerySchema } from './validators/shopee-validator.js';
import { IGenerateLinkInputSchema } from './validators/link-generator-validator.js';
import { IAnalyzeLinkInputSchema } from './validators/link-analyzer-validator.js';
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
}
