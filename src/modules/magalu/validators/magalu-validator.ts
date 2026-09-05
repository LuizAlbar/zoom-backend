import { z } from "zod";

export const searchMagaluQuerySchema = z.object({
  keyword: z.string().min(1, "O termo de busca (keyword) é obrigatório"),
  limit: z.coerce.number().min(1).max(20).optional().default(5),
});

export type ISearchMagaluQuerySchema = z.infer<typeof searchMagaluQuerySchema>;
