import Fastify from 'fastify';
import cors from '@fastify/cors';
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
import { FastifyHttpPresenter } from "./shared/http/fastify-http-presenter.js";
import { env } from "./shared/env/index.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  // CORS Config
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
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

  // Register REST API Routes
  await app.register(shopeeRoutes, { prefix: "/shopee" });

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
