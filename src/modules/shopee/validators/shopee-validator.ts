import { z } from "zod";

export const searchShopeeQuerySchema = z.object({
  keyword: z.string().min(1, "O termo de busca (keyword) é obrigatório"),
  limit: z.coerce.number().min(1).max(20).optional().default(5),
});

export type ISearchShopeeQuerySchema = z.infer<typeof searchShopeeQuerySchema>;
