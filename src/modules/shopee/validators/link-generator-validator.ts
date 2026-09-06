import { z } from "zod";

export const generateLinkInputSchema = z.object({
  original_url: z.string().url("A URL original deve ser uma URL válida"),
  sub_id: z.string().max(50, "O sub_id deve ter no máximo 50 caracteres").optional(),
});

export type IGenerateLinkInputSchema = z.infer<typeof generateLinkInputSchema>;

export const generateLinkOutputSchema = z.object({
  original_url: z.string(),
  short_link: z.string(),
  sub_id: z.string().nullable().optional(),
});

export type IGenerateLinkOutputSchema = z.infer<typeof generateLinkOutputSchema>;

export const successGenerateLinkResponse = z.object({
  data: generateLinkOutputSchema,
});
