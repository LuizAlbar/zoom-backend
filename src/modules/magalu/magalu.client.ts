import axios from 'axios';
import { env } from '../../shared/env/index.js';

export interface MagaluProductNode {
  sku: string;
  title: string;
  price: number;
  imageUrl: string;
  productLink: string;
}

export class MagaluClient {
  private async getAccessToken(): Promise<string> {
    const response = await axios.post('https://id.magalu.com/oauth/token', {
      grant_type: 'client_credentials',
      client_id: env.MAGALU_ID,
      client_secret: env.MAGALU_SECRET,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data.access_token;
  }

  async searchProducts(keyword: string, limit = 5): Promise<MagaluProductNode[]> {
    const token = await this.getAccessToken();

    // Chamada real para a API de Portfólio do Magalu
    const response = await axios.get(`${env.MAGALU_API_ENDPOINT}/seller/v1/portfolios/skus`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params: {
        _limit: limit,
      },
    });

    // Filtra e mapeia do formato real da API de SKUs do Magalu
    const skus = response.data?.skus || [];
    const filtered = skus.filter((sku: any) => 
      sku.title?.toLowerCase().includes(keyword.toLowerCase())
    );

    return filtered.map((sku: any) => ({
      sku: sku.sku,
      title: sku.title,
      price: sku.price?.price || 0,
      imageUrl: sku.images?.[0]?.url || '',
      productLink: `https://www.magazineluiza.com.br/busca/${encodeURIComponent(sku.title)}`,
    }));
  }
}
