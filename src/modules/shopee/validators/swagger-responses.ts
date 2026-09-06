import { z } from "zod";

export const errorResponse = z.object({
  message: z.string(),
  details: z.any().optional(),
});

export const shopeeProductSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  preco_num: z.number(),
  preco: z.string(),
  vendas: z.number(),
  taxa_comissao: z.string(),
  link_compra: z.string(),
  imagem: z.string().nullable().optional(),
});

export const successShopeeListResponse = z.object({
  data: z.object({
    products: z.array(shopeeProductSchema),
  }),
});
