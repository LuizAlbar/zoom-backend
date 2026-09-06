import { z } from "zod";

export const analyzeLinkInputSchema = z.object({
  url: z.string().url("A URL do produto deve ser uma URL válida"),
  sub_id: z.string().max(50, "O sub_id deve ter no máximo 50 caracteres").optional(),
});

export type IAnalyzeLinkInputSchema = z.infer<typeof analyzeLinkInputSchema>;

export const analyzeLinkOutputSchema = z.object({
  item_id: z.string(),
  titulo: z.string(),
  imagem: z.string(),
  preco_num: z.number(),
  preco: z.string(),
  taxa_comissao: z.string(),
  estimativa_comissao_num: z.number(),
  estimativa_comissao: z.string(),
  vendas: z.number(),
  short_link: z.string(),
  sub_id: z.string().nullable().optional(),
});

export type IAnalyzeLinkOutputSchema = z.infer<typeof analyzeLinkOutputSchema>;

export const successAnalyzeLinkResponse = z.object({
  data: analyzeLinkOutputSchema,
});
