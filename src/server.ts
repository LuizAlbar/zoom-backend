import { buildApp } from './app.js';
import { env } from './shared/env/index.js';

async function bootstrap() {
  const app = await buildApp();

  // Tratamento gracioso de desligamento para recarregamento seguro (SIGINT/SIGTERM)
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`[SHUTDOWN] Recebido sinal ${signal}. Fechando o servidor de forma graciosa...`);
      try {
        await app.close();
        app.log.info('[SHUTDOWN] Servidor fechado com sucesso.');
        process.exit(0);
      } catch (err) {
        app.log.error(err, '[SHUTDOWN] Erro ao fechar o servidor');
        process.exit(1);
      }
    });
  }

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
