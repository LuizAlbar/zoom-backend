import { ShopeeAffiliateClient } from './shopee.client.js';
import { ISearchShopeeQuerySchema } from './validators/shopee-validator.js';

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

      // Formata a taxa de comissão garantindo que termine com '%'
      const commissionRate = item.commissionRate.includes('%') 
        ? item.commissionRate 
        : `${item.commissionRate}%`;

      return {
        id: String(item.itemId),
        titulo: item.productName,
        preco_num: priceNum,
        preco: `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
        vendas: item.sales || 0,
        taxa_comissao: commissionRate,
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
}
