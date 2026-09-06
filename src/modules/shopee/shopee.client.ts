import crypto from 'node:crypto';
import axios from 'axios';
import { env } from '../../shared/env/index.js';

export interface ShopeeProductNode {
  itemId: string;
  productName: string;
  price: string;
  sales: number;
  imageUrl: string;
  productLink: string;
  offerLink: string;
  commissionRate: string;
}

export class ShopeeAffiliateClient {
  private generateAuthHeader(payloadString: string, timestamp: number): string {
    const rawSign = `${env.SHOPEE_APP_ID}${timestamp}${payloadString}${env.SHOPEE_SECRET}`;
    const signature = crypto.createHash('sha256').update(rawSign).digest('hex');
    return `SHA256 Credential=${env.SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`;
  }

  async searchProducts(keyword: string, limit = 5): Promise<ShopeeProductNode[]> {
    const query = `
      query searchProducts($keyword: String, $limit: Int) {
        productOfferV2(keyword: $keyword, page: 1, limit: $limit, listType: 0, sortType: 1) {
          nodes {
            itemId
            productName
            price
            sales
            imageUrl
            productLink
            offerLink
            commissionRate
          }
        }
      }
    `;

    const payload = JSON.stringify({
      query,
      variables: { keyword, limit },
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const authHeader = this.generateAuthHeader(payload, timestamp);

    const response = await axios.post(env.SHOPEE_GRAPHQL_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    if (response.data.errors) {
      throw new Error(`Shopee GraphQL Error: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data?.data?.productOfferV2?.nodes || [];
  }

  async generateShortLink(originalUrl: string, subId?: string): Promise<string> {
    const query = `
      mutation generateShortLink($input: ShortLinkInput!) {
        generateShortLink(input: $input) {
          shortLink
        }
      }
    `;

    const payload = JSON.stringify({
      query,
      variables: {
        input: {
          originUrl: originalUrl,
          subIds: subId ? [subId] : undefined,
        },
      },
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const authHeader = this.generateAuthHeader(payload, timestamp);

    const response = await axios.post(env.SHOPEE_GRAPHQL_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    if (response.data.errors) {
      throw new Error(`Shopee GraphQL Error: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data?.data?.generateShortLink?.shortLink || '';
  }
}
