import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { mcpServer } from './shared/mcp/mcp.server.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: '*' });

  let transport: SSEServerTransport | null = null;

  // Endpoint SSE: Gemini conecta aqui para registrar canal de retorno
  app.get('/sse', async (req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    transport = new SSEServerTransport('/messages', reply.raw);
    await mcpServer.connect(transport);
  });

  // Endpoint POST: Gemini envia JSON-RPC das chamadas de tool
  app.post('/messages', async (req, reply) => {
    if (!transport) {
      reply.status(400).send('Sessão MCP não inicializada via /sse.');
      return;
    }
    await transport.handlePostMessage(req.raw, reply.raw);
  });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
