import type { FastifyReply, FastifyRequest } from "fastify";
import { FastifyHttpPresenter } from "../../../shared/http/fastify-http-presenter.js";
import { ShopeeService } from "../shopee.service.js";
import { analyzeLinkInputSchema } from "../validators/link-analyzer-validator.js";

export async function analyzeAffiliateProductLinkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const bodyParams = analyzeLinkInputSchema.parse(request.body);

  const shopeeService = new ShopeeService();

  const result = await shopeeService.analyzeProductLink(bodyParams);

  return FastifyHttpPresenter.success(reply, 200, result);
}
