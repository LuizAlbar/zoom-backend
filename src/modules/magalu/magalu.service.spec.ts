import { describe, it, expect, vi } from 'vitest';
import { MagaluService } from './magalu.service.js';
import { MagaluClient } from './magalu.client.js';

describe('MagaluService', () => {
  it('should search and format magalu products correctly', async () => {
    // Arrange
    const mockProducts = [
      {
        sku: 'MGL-999',
        title: 'Smartphone Motorola Edge 50',
        price: 2199.90,
        imageUrl: 'https://magalu.com/smartphone.png',
        productLink: 'https://magalu.com/smartphone',
      }
    ];

    const mockClient = {
      searchProducts: vi.fn().mockResolvedValue(mockProducts),
    } as unknown as MagaluClient;

    const service = new MagaluService(mockClient);

    // Act
    const result = await service.searchAndFormat('motorola', 1);

    // Assert
    expect(mockClient.searchProducts).toHaveBeenCalledWith('motorola', 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'MGL-999',
      titulo: 'Smartphone Motorola Edge 50',
      preco: 'R$ 2199,90',
      link_compra: 'https://magalu.com/smartphone',
      imagem: 'https://magalu.com/smartphone.png',
    });
  });
});
