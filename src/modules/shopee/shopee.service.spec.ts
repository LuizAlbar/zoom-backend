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
    const result = await service.searchAndFormat('mouse', 1);

    // Assert
    expect(mockClient.searchProducts).toHaveBeenCalledWith('mouse', 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: '12345',
      titulo: 'Mouse Gamer Wireless',
      preco: 'R$ 150.00',
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
    const result = await service.searchAndFormat('teclado', 1);

    // Assert
    expect(result[0].link_compra).toBe('https://shopee.com/keyboard');
  });
});
