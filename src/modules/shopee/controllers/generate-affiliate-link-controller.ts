import type { FastifyReply, FastifyRequest } from "fastify";
import { FastifyHttpPresenter } from "../../../shared/http/fastify-http-presenter.js";
import { ShopeeService } from "../shopee.service.js";
import { generateLinkInputSchema } from "../validators/link-generator-validator.js";

export async function generateAffiliateLinkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const bodyParams = generateLinkInputSchema.parse(request.body);

  const shopeeService = new ShopeeService();

  const result = await shopeeService.generateAffiliateLink(bodyParams);

  return FastifyHttpPresenter.success(reply, 201, result);
}
