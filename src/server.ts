import { buildApp } from './app.js';
import { env } from './shared/env/index.js';
import { logger } from './shared/log/logger.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance | null = null;
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`🔴 Recebido sinal ${signal}. Encerrando conexões ativas...`);

  if (app) {
    try {
      // Destrói ativamente todas as conexões TCP (incluindo streams hijackados do MCP)
      if (app.server && typeof app.server.closeAllConnections === 'function') {
        app.server.closeAllConnections();
        app.server.closeIdleConnections();
      }
      await app.close();
      logger.info('✅ Servidor Fastify e conexões TCP encerradas com sucesso.');
    } catch (err: any) {
      logger.error('Erro durante o fechamento do app:', err);
    }
  }

  process.exit(0);
}

// Captura sinais do tsx --watch e do sistema operacional
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

async function startServer() {
  try {
    app = await buildApp();
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Servidor MCP rodando na porta ${env.PORT}`);
    logger.info(`MCP Endpoint: http://localhost:${env.PORT}/mcp`);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Porta ${env.PORT} já está em uso por outro processo no sistema operacional.`);
    } else {
      logger.error('Falha crítica ao iniciar o servidor:', err);
    }
    process.exit(1);
  }
}

startServer();
