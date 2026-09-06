import { z } from "zod";

export const buildBundleInputSchema = z.object({
  items: z.array(z.string().min(2, "Cada item deve ter pelo menos 2 caracteres"))
    .min(2, "O kit deve conter no mínimo 2 categorias de itens")
    .max(6, "O kit deve conter no máximo 6 categorias de itens"),
  max_total_budget: z.number().positive("O orçamento máximo deve ser maior que zero"),
});

export type IBuildBundleInputSchema = z.infer<typeof buildBundleInputSchema>;

export const bundleItemSchema = z.object({
  categoria: z.string(),
  id: z.string(),
  titulo: z.string(),
  preco_num: z.number(),
  preco: z.string(),
  vendas: z.number(),
  imagem: z.string(),
  link_compra: z.string(),
});

export const buildBundleOutputSchema = z.object({
  orcamento_maximo_num: z.number(),
  orcamento_maximo: z.string(),
  valor_total_kit_num: z.number(),
  valor_total_kit: z.string(),
  saldo_restante_num: z.number(),
  saldo_restante: z.string(),
  total_itens: z.number(),
  itens: z.array(bundleItemSchema),
});

export type IBuildBundleOutputSchema = z.infer<typeof buildBundleOutputSchema>;

export const successBuildBundleResponse = z.object({
  data: buildBundleOutputSchema,
});
