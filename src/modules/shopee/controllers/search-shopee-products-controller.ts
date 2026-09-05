import type { FastifyReply, FastifyRequest } from "fastify";
import { FastifyHttpPresenter } from "../../../shared/http/fastify-http-presenter.js";
import { ShopeeService } from "../shopee.service.js";
import { searchShopeeQuerySchema } from "../validators/shopee-validator.js";

export async function searchShopeeProductsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { keyword, limit } = searchShopeeQuerySchema.parse(request.query);

  const shopeeService = new ShopeeService();

  const products = await shopeeService.searchAndFormat(keyword, limit);

  return FastifyHttpPresenter.success(reply, 200, {
    products,
  });
}
