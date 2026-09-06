import { z } from "zod";

export const inspectSellerInputSchema = z.object({
  url: z.string().url("A URL deve ser válida").optional(),
  item_id: z.string().optional(),
}).refine((data) => data.url || data.item_id, {
  message: "É necessário fornecer a URL do produto ou o ID do item",
  path: ["url"],
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
