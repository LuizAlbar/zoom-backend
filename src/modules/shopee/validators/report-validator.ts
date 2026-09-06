import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const conversionReportQuerySchema = z.object({
  start_date: z.string().regex(dateRegex, "A data inicial deve estar no formato YYYY-MM-DD"),
  end_date: z.string().regex(dateRegex, "A data final deve estar no formato YYYY-MM-DD"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
}).refine((data) => {
  const start = new Date(data.start_date + "T00:00:00");
  const end = new Date(data.end_date + "T00:00:00");
  return start <= end;
}, {
  message: "A data inicial (start_date) não pode ser posterior à data final (end_date)",
  path: ["start_date"],
});

export type IConversionReportInputSchema = z.infer<typeof conversionReportQuerySchema>;

export const reportItemSchema = z.object({
  itemId: z.string(),
  nome: z.string(),
  quantidade: z.number(),
  comissao_gerada_num: z.number(),
  comissao_gerada: z.string(),
});

export const conversionReportOutputSchema = z.object({
  periodo: z.object({
    inicio: z.string(),
    fim: z.string(),
  }),
  resumo: z.object({
    total_pedidos: z.number(),
    comissao_estimada_num: z.number(),
    comissao_estimada: z.string(),
    cliques_totais: z.number(),
  }),
  principais_itens_vendidos: z.array(reportItemSchema),
});

export type IConversionReportOutputSchema = z.infer<typeof conversionReportOutputSchema>;

export const successConversionReportResponse = z.object({
  data: conversionReportOutputSchema,
});
