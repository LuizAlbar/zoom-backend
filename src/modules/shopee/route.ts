import type { FastifyZodTypedInstance } from "../../shared/utils/@types/fastify-zod-type-provider.js";
import { searchShopeeProductsController } from "./controllers/search-shopee-products-controller.js";
import { searchShopeeQuerySchema } from "./validators/shopee-validator.js";
import { errorResponse, successShopeeListResponse } from "./validators/swagger-responses.js";
import { generateAffiliateLinkController } from "./controllers/generate-affiliate-link-controller.js";
import { generateLinkInputSchema, successGenerateLinkResponse } from "./validators/link-generator-validator.js";
import { analyzeAffiliateProductLinkController } from "./controllers/analyze-affiliate-product-link-controller.js";
import { analyzeLinkInputSchema, successAnalyzeLinkResponse } from "./validators/link-analyzer-validator.js";

export async function shopeeRoutes(app: FastifyZodTypedInstance) {
  app.get(
    "/search",
    {
      schema: {
        tags: ["shopee"],
        description: "Busca produtos no marketplace da Shopee",
        querystring: searchShopeeQuerySchema,
        response: {
          200: successShopeeListResponse,
          400: errorResponse,
          500: errorResponse,
        },
      },
    },
    searchShopeeProductsController
  );

  app.post(
    "/links/generate",
    {
      schema: {
        tags: ["shopee"],
        description: "Gera um link de afiliado encurtado com rastreamento a partir de uma URL original da Shopee",
        body: generateLinkInputSchema,
        response: {
          201: successGenerateLinkResponse,
          400: errorResponse,
          500: errorResponse,
        },
      },
    },
    generateAffiliateLinkController
  );

  app.post(
    "/links/analyze",
    {
      schema: {
        tags: ["shopee"],
        description: "Analisa um link de produto da Shopee, extrai detalhes, calcula a estimativa de comissão e gera o link encurtado comissionado",
        body: analyzeLinkInputSchema,
        response: {
          200: successAnalyzeLinkResponse,
          400: errorResponse,
          500: errorResponse,
        },
      },
    },
    analyzeAffiliateProductLinkController
  );
}
