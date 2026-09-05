import type { FastifyZodTypedInstance } from "../../shared/utils/@types/fastify-zod-type-provider.js";
import { searchShopeeProductsController } from "./controllers/search-shopee-products-controller.js";
import { searchShopeeQuerySchema } from "./validators/shopee-validator.js";
import { errorResponse, successShopeeListResponse } from "./validators/swagger-responses.js";

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
}
