import { z } from "zod";

export const inspectSellerInputSchema = z.object({
  item_id: z.string().optional(),
  url: z.string().url("A URL do produto deve ser uma URL válida").optional(),
}).refine((data) => data.item_id || data.url, {
  message: "É obrigatório informar pelo menos o item_id ou a url do produto.",
  path: ["item_id"],
});

export type IInspectSellerInputSchema = z.infer<typeof inspectSellerInputSchema>;

export const inspectSellerOutputSchema = z.object({
  item_id: z.string(),
  titulo: z.string(),
  score_confianca: z.number(),
  nivel: z.string(),
  vendas_totais: z.number(),
  avaliacao_media: z.number(),
  alertas: z.array(z.string()),
  recomendacao: z.string(),
  link_seguro: z.string(),
});

export type IInspectSellerOutputSchema = z.infer<typeof inspectSellerOutputSchema>;

export const successInspectSellerResponse = z.object({
  data: inspectSellerOutputSchema,
});
