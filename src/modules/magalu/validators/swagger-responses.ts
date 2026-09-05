import { z } from "zod";

export const errorResponse = z.object({
  message: z.string(),
  details: z.any().optional(),
});

export const magaluProductSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  preco: z.string(),
  link_compra: z.string(),
  imagem: z.string().nullable().optional(),
});

export const successMagaluListResponse = z.object({
  data: z.object({
    products: z.array(magaluProductSchema),
  }),
});
