import type { FastifyZodTypedInstance } from "../../shared/utils/@types/fastify-zod-type-provider.js";
import { searchMagaluProductsController } from "./controllers/search-magalu-products-controller.js";
import { searchMagaluQuerySchema } from "./validators/magalu-validator.js";
import { errorResponse, successMagaluListResponse } from "./validators/swagger-responses.js";

export async function magaluRoutes(app: FastifyZodTypedInstance) {
  app.get(
    "/search",
    {
      schema: {
        tags: ["magalu"],
        description: "Busca produtos no catálogo do lojista no Magazine Luiza (Magalu)",
        querystring: searchMagaluQuerySchema,
        response: {
          200: successMagaluListResponse,
          400: errorResponse,
          500: errorResponse,
        },
      },
    },
    searchMagaluProductsController
  );
}
