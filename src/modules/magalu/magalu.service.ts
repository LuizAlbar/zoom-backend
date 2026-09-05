import { MagaluClient } from './magalu.client.js';

export class MagaluService {
  constructor(private client = new MagaluClient()) {}

  async searchAndFormat(keyword: string, limit: number) {
    const products = await this.client.searchProducts(keyword, limit);
    return products.map((item) => ({
      id: item.sku,
      titulo: item.title,
      preco: `R$ ${item.price.toFixed(2).replace('.', ',')}`,
      link_compra: item.productLink,
      imagem: item.imageUrl,
    }));
  }
}
