import { buildApp } from './app.js';
import { env } from './shared/env/index.js';

async function bootstrap() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Servidor MCP rodando na porta ${env.PORT}`);
    console.log(`📡 MCP Endpoint: http://localhost:${env.PORT}/mcp`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
