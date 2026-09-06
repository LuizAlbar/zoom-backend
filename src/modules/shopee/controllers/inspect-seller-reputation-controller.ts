import type { FastifyReply, FastifyRequest } from "fastify";
import { FastifyHttpPresenter } from "../../../shared/http/fastify-http-presenter.js";
import { ShopeeService } from "../shopee.service.js";
import { inspectSellerInputSchema } from "../validators/inspect-validator.js";

export async function inspectSellerReputationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const bodyParams = inspectSellerInputSchema.parse(request.body);

  const shopeeService = new ShopeeService();

  const result = await shopeeService.inspectSellerReputation(bodyParams);

  return FastifyHttpPresenter.success(reply, 200, result);
}
