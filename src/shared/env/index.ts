import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  SHOPEE_APP_ID: z.string().min(1, 'SHOPEE_APP_ID é obrigatório'),
  SHOPEE_SECRET: z.string().min(1, 'SHOPEE_SECRET é obrigatório'),
  SHOPEE_GRAPHQL_ENDPOINT: z
    .string()
    .url()
    .default('https://open-api.affiliate.shopee.com.br/graphql'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração inválida de variáveis de ambiente:', _env.error.format());
  throw new Error('Variáveis de ambiente inválidas.');
}

export const env = _env.data;
