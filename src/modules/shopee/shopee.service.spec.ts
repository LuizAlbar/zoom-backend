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

  it('should generate affiliate link correctly', async () => {
    // Arrange
    const mockClient = {
      generateShortLink: vi.fn().mockResolvedValue('https://shope.ee/mGL123'),
    } as unknown as ShopeeAffiliateClient;

    const service = new ShopeeService(mockClient);

    // Act
    const result = await service.generateAffiliateLink({
      original_url: 'https://shopee.com.br/product-i.123',
      sub_id: 'campanha01',
    });

    // Assert
    expect(mockClient.generateShortLink).toHaveBeenCalledWith('https://shopee.com.br/product-i.123', 'campanha01');
    expect(result).toEqual({
      original_url: 'https://shopee.com.br/product-i.123',
      short_link: 'https://shope.ee/mGL123',
      sub_id: 'campanha01',
    });
  });

  it('should analyze affiliate product link correctly', async () => {
    // Arrange
    const mockProducts = [
      {
        itemId: '987654321',
        productName: 'Fone de Ouvido Bluetooth',
        price: '120.00',
        sales: 3420,
        imageUrl: 'https://shopee.com/image.png',
        productLink: 'https://shopee.com/product',
        offerLink: 'https://shopee.com/offer',
        commissionRate: '12%',
      }
    ];

    const mockClient = {
      getProductById: vi.fn().mockResolvedValue(mockProducts[0]),
      generateShortLink: vi.fn().mockResolvedValue('https://s.shopee.com.br/xyz123'),
    } as unknown as ShopeeAffiliateClient;

    const service = new ShopeeService(mockClient);

    // Act
    const result = await service.analyzeProductLink({
      url: 'https://shopee.com.br/Produto-Exemplo-i.12345678.987654321',
      sub_id: 'campanha_promocional',
    });

    // Assert
    expect(mockClient.getProductById).toHaveBeenCalledWith('987654321');
    expect(mockClient.generateShortLink).toHaveBeenCalledWith('https://shopee.com/product', 'campanha_promocional');
    expect(result).toEqual({
      item_id: '987654321',
      titulo: 'Fone de Ouvido Bluetooth',
      imagem: 'https://shopee.com/image.png',
      preco_num: 120.00,
      preco: 'R$ 120,00',
      taxa_comissao: '12%',
      estimativa_comissao_num: 14.40,
      estimativa_comissao: 'R$ 14,40',
      vendas: 3420,
      short_link: 'https://s.shopee.com.br/xyz123',
      sub_id: 'campanha_promocional',
    });
  });
});
