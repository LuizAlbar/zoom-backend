import type { FastifyZodTypedInstance } from "../../shared/utils/@types/fastify-zod-type-provider.js";
import { searchShopeeProductsController } from "./controllers/search-shopee-products-controller.js";
import { searchShopeeQuerySchema } from "./validators/shopee-validator.js";
import { errorResponse, successShopeeListResponse } from "./validators/swagger-responses.js";
import { generateAffiliateLinkController } from "./controllers/generate-affiliate-link-controller.js";
import { generateLinkInputSchema, successGenerateLinkResponse } from "./validators/link-generator-validator.js";

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
}
