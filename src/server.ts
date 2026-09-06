import { buildApp } from './app.js';
import { env } from './shared/env/index.js';

async function startServerWithRetry(app: any, port: number, retries = 5, delay = 200) {
  for (let i = 0; i < retries; i++) {
    try {
      await app.listen({ port, host: '0.0.0.0' });
      console.log(`🚀 Servidor MCP rodando na porta ${port}`);
      console.log(`📡 MCP Endpoint: http://localhost:${port}/mcp`);
      return;
    } catch (err: any) {
      if (err.code === 'EADDRINUSE' && i < retries - 1) {
        app.log.warn(`[PORTA PRESA] Porta ${port} em uso. Tentando novamente em ${delay}ms... (Tentativa ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

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
    await startServerWithRetry(app, env.PORT);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
