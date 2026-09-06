import { z } from "zod";

export const searchShopeeQuerySchema = z.object({
  keyword: z.string().min(1, "O termo de busca (keyword) é obrigatório"),
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  sort_by: z.enum(['relevance', 'price_asc', 'price_desc', 'sales_desc']).optional(),
});

export type ISearchShopeeQuerySchema = z.infer<typeof searchShopeeQuerySchema>;
