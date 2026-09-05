import type { FastifyReply } from "fastify";

export class FastifyHttpPresenter {
  static success<T>(reply: FastifyReply, statusCode: number, data: T) {
    return reply.status(statusCode).send({ data });
  }

  static error(reply: FastifyReply, statusCode: number, message: string, details: any = null) {
    return reply.status(statusCode).send({ message, details });
  }
}
