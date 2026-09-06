import type { FastifyReply, FastifyRequest } from "fastify";
import { FastifyHttpPresenter } from "../../../shared/http/fastify-http-presenter.js";
import { ShopeeService } from "../shopee.service.js";
import { conversionReportQuerySchema } from "../validators/report-validator.js";

export async function getConversionReportController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = conversionReportQuerySchema.parse(request.query);

  const shopeeService = new ShopeeService();

  const report = await shopeeService.getConversionReport(params);

  return FastifyHttpPresenter.success(reply, 200, report);
}
