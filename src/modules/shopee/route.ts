import type { FastifyZodTypedInstance } from "../../shared/utils/@types/fastify-zod-type-provider.js";
import { searchShopeeProductsController } from "./controllers/search-shopee-products-controller.js";
import { searchShopeeQuerySchema } from "./validators/shopee-validator.js";
import { errorResponse, successShopeeListResponse } from "./validators/swagger-responses.js";
import { generateAffiliateLinkController } from "./controllers/generate-affiliate-link-controller.js";
import { generateLinkInputSchema, successGenerateLinkResponse } from "./validators/link-generator-validator.js";
import { analyzeAffiliateProductLinkController } from "./controllers/analyze-affiliate-product-link-controller.js";
import { analyzeLinkInputSchema, successAnalyzeLinkResponse } from "./validators/link-analyzer-validator.js";
import { buildBundleByBudgetController } from "./controllers/build-bundle-by-budget-controller.js";
import { buildBundleInputSchema, successBuildBundleResponse } from "./validators/bundle-validator.js";
import { getConversionReportController } from "./controllers/get-conversion-report-controller.js";
import { conversionReportQuerySchema, successConversionReportResponse } from "./validators/report-validator.js";
import { inspectSellerReputationController } from "./controllers/inspect-seller-reputation-controller.js";
import { inspectSellerInputSchema, successInspectSellerResponse } from "./validators/inspect-validator.js";

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

  app.post(
    "/products/bundle",
    {
      schema: {
        tags: ["shopee"],
        description: "Monta um kit otimizado de produtos selecionando exatamente um item para cada termo solicitado dentro do orçamento máximo",
        body: buildBundleInputSchema,
        response: {
          200: successBuildBundleResponse,
          400: errorResponse,
          422: errorResponse,
          500: errorResponse,
        },
      },
    },
    buildBundleByBudgetController
  );

  app.get(
    "/reports/conversions",
    {
      schema: {
        tags: ["shopee"],
        description: "Obtém o relatório consolidado de conversões e comissões ganhas de afiliado no período especificado",
        querystring: conversionReportQuerySchema,
        response: {
          200: successConversionReportResponse,
          400: errorResponse,
          500: errorResponse,
        },
      },
    },
    getConversionReportController
  );

  app.post(
    "/sellers/inspect",
    {
      schema: {
        tags: ["shopee"],
        description: "Audita e inspeciona a reputação e segurança de um anúncio ou loja da Shopee a partir de seu ID ou URL",
        body: inspectSellerInputSchema,
        response: {
          200: successInspectSellerResponse,
          400: errorResponse,
          500: errorResponse,
        },
      },
    },
    inspectSellerReputationController
  );
}
