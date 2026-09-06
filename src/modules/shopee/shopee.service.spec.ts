import { describe, it, expect, vi } from 'vitest';
import { ShopeeService } from './shopee.service.js';
import { ShopeeAffiliateClient } from './shopee.client.js';

describe('ShopeeService', () => {
  it('should search and format shopee products correctly', async () => {
    // Arrange
    const mockProducts = [
      {
        itemId: '12345',
        productName: 'Mouse Gamer Wireless',
        price: '150.00',
        sales: 50,
        imageUrl: 'https://shopee.com/image.png',
        productLink: 'https://shopee.com/product',
        offerLink: 'https://shopee.com/offer',
        commissionRate: '5%',
      }
    ];

    const mockClient = {
      searchProducts: vi.fn().mockResolvedValue(mockProducts),
    } as unknown as ShopeeAffiliateClient;

    const service = new ShopeeService(mockClient);

    // Act
    const result = await service.searchAndFormat({ keyword: 'mouse', limit: 1 });

    // Assert
    expect(mockClient.searchProducts).toHaveBeenCalledWith('mouse', 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: '12345',
      titulo: 'Mouse Gamer Wireless',
      preco_num: 150.00,
      preco: 'R$ 150,00',
      vendas: 50,
      taxa_comissao: '5%',
      link_compra: 'https://shopee.com/offer',
      imagem: 'https://shopee.com/image.png',
    });
  });

  it('should use productLink if offerLink is empty', async () => {
    // Arrange
    const mockProducts = [
      {
        itemId: '67890',
        productName: 'Teclado Gamer Mecânico',
        price: '250.00',
        sales: 20,
        imageUrl: 'https://shopee.com/keyboard.png',
        productLink: 'https://shopee.com/keyboard',
        offerLink: '',
        commissionRate: '6%',
      }
    ];

    const mockClient = {
      searchProducts: vi.fn().mockResolvedValue(mockProducts),
    } as unknown as ShopeeAffiliateClient;

    const service = new ShopeeService(mockClient);

    // Act
    const result = await service.searchAndFormat({ keyword: 'teclado', limit: 1 });

    // Assert
    expect(result[0].link_compra).toBe('https://shopee.com/keyboard');
  });

  it('should filter products by price and sort them accordingly', async () => {
    // Arrange
    const mockProducts = [
      {
        itemId: '1',
        productName: 'Produto A',
        price: '10.00',
        sales: 100,
        imageUrl: 'img1',
        productLink: 'lnk1',
        offerLink: 'off1',
        commissionRate: '10%',
      },
      {
        itemId: '2',
        productName: 'Produto B',
        price: '50.00',
        sales: 10,
        imageUrl: 'img2',
        productLink: 'lnk2',
        offerLink: 'off2',
        commissionRate: '10%',
      },
      {
        itemId: '3',
        productName: 'Produto C',
        price: '100.00',
        sales: 500,
        imageUrl: 'img3',
        productLink: 'lnk3',
        offerLink: 'off3',
        commissionRate: '10%',
      }
    ];

    const mockClient = {
      searchProducts: vi.fn().mockResolvedValue(mockProducts),
    } as unknown as ShopeeAffiliateClient;

    const service = new ShopeeService(mockClient);

    // Act: Filter between R$ 15 and R$ 150, sorted by sales descending
    const result = await service.searchAndFormat({
      keyword: 'teste',
      limit: 5,
      min_price: 15,
      max_price: 150,
      sort_by: 'sales_desc',
    });

    // Assert: Only product B (50) and C (100) are in range. Sorted by sales descending: C first, then B.
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('3');
    expect(result[1].id).toBe('2');
  });
});
