import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './shared/mcp/mcp.server.js';
import { shopeeRoutes } from "./modules/shopee/route.js";
import { magaluRoutes } from "./modules/magalu/route.js";
import { FastifyHttpPresenter } from "./shared/http/fastify-http-presenter.js";
import { env } from "./shared/env/index.js";
import { logger } from "./shared/log/logger.js";

export async function buildApp() {
  const app = Fastify({ logger: true, forceCloseConnections: true });

  // CORS Config
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
  });

  // Rate Limit Config: max 10 requests por segundo por IP
  await app.register(rateLimit, {
    max: 10,
    timeWindow: '1 second',
  });

  // Zod Type Provider Config
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Swagger Config
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "E-Commerce MCP Hub API Docs",
        description: "API de Busca do E-Commerce MCP Hub com suporte a Shopee",
        version: "1.0.0",
      },
      servers: [
        {
          url: "/",
          description: "Current Host (Dynamic)",
        },
        {
          url: `http://localhost:${env.PORT}`,
          description: "Local Access (Backend)",
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      filter: true,
      displayRequestDuration: true,
    },
    theme: {
      title: "E-Commerce MCP Hub API Docs",
    },
  });

  // Error Handler Config
  app.setErrorHandler((err: any, _request, reply) => {
    if (err.validation) {
      const details = err.validation.map((v: any) => ({
        field: v.instancePath.replace("/", "") || v.params?.missingProperty || "field",
        message: v.message || "Valor inválido",
      }));

      return FastifyHttpPresenter.error(
        reply,
        400,
        "Erro de validação nos dados enviados",
        details,
      );
    }

    console.error(err);
    return FastifyHttpPresenter.error(
      reply,
      err.statusCode || 500,
      err.message || "Internal Server Error",
      err,
    );
  });

  // Endpoint MCP unificado usando o moderno StreamableHTTPServerTransport
  app.all('/mcp', async (req, reply) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless para alta escalabilidade e segurança
    });

    const server = createMcpServer();

    // Hijack da resposta do Fastify para controle direto pelo transport
    reply.hijack();

    reply.raw.once("close", () => {
      try {
        transport.close();
      } catch (err) {
        app.log.error(err);
      }
    });

    await server.connect(transport);
    await transport.handleRequest(req.raw, reply.raw, req.body);
  });

  // Se for ambiente de desenvolvimento, logar tráfego de dados (inputs e outputs) das requisições
  if (env.NODE_ENV === 'dev') {
    app.addHook('preHandler', async (request) => {
      logger.debug(`📥 Request [${request.method}] ${request.url} - Query:`, request.query, 'Body:', request.body);
    });

    app.addHook('onSend', async (request, reply, payload) => {
      try {
        let parsedPayload = payload;
        if (typeof payload === 'string') {
          parsedPayload = JSON.parse(payload);
        }
        logger.debug(`📤 Response [${request.method}] ${request.url} [Status: ${reply.statusCode}] - Body:`, parsedPayload);
      } catch {
        // Ignora payloads binários, buffers ou não parseáveis
      }
    });
  }

  // Register REST API Routes
  await app.register(shopeeRoutes, { prefix: "/shopee" });
  await app.register(magaluRoutes, { prefix: "/magalu" });

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
