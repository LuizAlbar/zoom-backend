import { ShopeeAffiliateClient } from './shopee.client.js';

export class ShopeeService {
  constructor(private client = new ShopeeAffiliateClient()) {}

  async searchAndFormat(keyword: string, limit: number) {
    const products = await this.client.searchProducts(keyword, limit);
    return products.map((item) => ({
      id: item.itemId,
      titulo: item.productName,
      preco: `R$ ${item.price}`,
      link_compra: item.offerLink || item.productLink,
      imagem: item.imageUrl,
    }));
  }
}
