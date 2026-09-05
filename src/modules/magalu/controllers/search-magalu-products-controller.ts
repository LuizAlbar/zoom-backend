import type { FastifyReply, FastifyRequest } from "fastify";
import { FastifyHttpPresenter } from "../../../shared/http/fastify-http-presenter.js";
import { MagaluService } from "../magalu.service.js";
import { searchMagaluQuerySchema } from "../validators/magalu-validator.js";

export async function searchMagaluProductsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { keyword, limit } = searchMagaluQuerySchema.parse(request.query);

  const magaluService = new MagaluService();

  const products = await magaluService.searchAndFormat(keyword, limit);

  return FastifyHttpPresenter.success(reply, 200, {
    products,
  });
}
