import type { FastifyReply, FastifyRequest } from "fastify";
import { FastifyHttpPresenter } from "../../../shared/http/fastify-http-presenter.js";
import { ShopeeService } from "../shopee.service.js";
import { buildBundleInputSchema } from "../validators/bundle-validator.js";

export async function buildBundleByBudgetController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const bodyParams = buildBundleInputSchema.parse(request.body);

  const shopeeService = new ShopeeService();

  const result = await shopeeService.buildBundleByBudget(bodyParams);

  return FastifyHttpPresenter.success(reply, 200, result);
}
