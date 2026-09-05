# E-Commerce MCP Hub & REST API

Este projeto é um servidor híbrido em **Node.js** com **TypeScript** e **Fastify** que atua simultaneamente como:
1. **Servidor MCP (Model Context Protocol)**: Permite que agentes de IA (como o Gemini Enterprise) se conectem e utilizem ferramentas (*tools*) de e-commerce via transporte SSE (Server-Sent Events) sobre HTTP.
2. **REST API Autodocumentada**: Expõe rotas tradicionais com validação via **Zod** (`fastify-type-provider-zod`) e documentação interativa com **Swagger / Swagger UI**.

A primeira grande integração disponível é com o marketplace da **Shopee Affiliate Open API** (GraphQL), que possibilita buscar itens no marketplace e retornar títulos, imagens, preços formatados e links rastreados de compra.

---

## 🛠️ Tecnologias Utilizadas

- **Fastify** — Framework web ultra veloz para Node.js.
- **TypeScript** — Tipagem estática para robustez do código.
- **@modelcontextprotocol/sdk** — SDK oficial para criação de servidores MCP.
- **Zod** & **fastify-type-provider-zod** — Validação estrita de esquemas e tipos.
- **@fastify/swagger** & **@fastify/swagger-ui** — OpenAPI e documentação interativa em `/docs`.
- **Axios** — Requisições HTTP para chamadas GraphQL à API Shopee.
- **Docker & Docker Compose** — Conteinerização completa com suporte a hot-reload (volume mapeado) e túnel público via **Ngrok**.

---

## 📂 Arquitetura de Pastas

A estrutura segue o padrão de módulos isolados e recursos compartilhados para facilitar a manutenção e escalabilidade:

```plaintext
backend/
├── dev/
│   ├── Dockerfile.dev         # Dockerfile otimizado para o ambiente de desenvolvimento
│   └── docker-compose.dev.yaml# Orquestração local com Ngrok
├── src/
│   ├── app.ts                  # Configuração do Fastify, Swagger, CORS, erro global e rotas
│   ├── server.ts               # Ponto de entrada que inicializa a aplicação
│   ├── modules/
│   │   ├── shopee/
│   │   │   ├── controllers/    # Controladores REST das rotas
│   │   │   ├── validators/     # Esquemas de validação (Zod) e respostas Swagger
│   │   │   ├── shopee.client.ts# Cliente GraphQL e assinatura criptográfica SHA256
│   │   │   ├── shopee.service.ts# Regras de negócio e formatação de dados
│   │   │   ├── shopee.tool.ts  # Declaração e registro de ferramentas MCP
│   │   │   └── route.ts        # Rotas HTTP do módulo Shopee
│   │   ├── magalu/
│   │   │   └── .gitkeep        # Placeholder para módulo futuro do marketplace Magalu
│   │   └── auth/
│   │       └── .gitkeep        # Placeholder para módulo futuro de Auth/IAM
│   └── shared/
│       ├── env/
│       │   └── index.ts        # Validação estrita de variáveis de ambiente com Zod
│       ├── http/
│       │   └── fastify-http-presenter.ts # Formatador padrão de respostas JSON
│       ├── mcp/
│       │   └── mcp.server.ts   # Instância do McpServer e agregação de ferramentas
│       └── utils/
│           └── @types/
│               └── fastify-zod-type-provider.ts # Tipo auxiliar do Fastify + Zod
├── .dockerignore               # Filtro de arquivos para os builds do Docker
├── .gitignore                  # Arquivos ignorados pelo controle de versão
├── Dockerfile                  # Dockerfile de produção multi-stage otimizado para Serverless
├── package.json                # Scripts e gerenciamento de pacotes (pnpm)
├── tsconfig.json               # Configurações do compilador TypeScript (ES2022/NodeNext)
└── README.md                   # Documentação da aplicação
```

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
- Node.js instalado (v20 ou superior recomendado).
- Gerenciador de pacotes **pnpm** (`npm install -g pnpm`).

### 1. Clonar e Instalar as Dependências
Abra o diretório `backend` no seu terminal e execute:
```bash
pnpm install
```

*Nota: Caso o pnpm mostre o erro `[ERR_PNPM_IGNORED_BUILDS]`, rode `pnpm approve-builds` para aprovar a compilação do `esbuild` exigido pelo `tsx`.*

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` com base no arquivo `.env.example`:
```bash
cp .env.example .env
```
Preencha o arquivo `.env` com suas credenciais da Shopee Affiliate API:
```env
PORT=8080
SHOPEE_APP_ID=seu_shopee_app_id_aqui
SHOPEE_SECRET=seu_shopee_secret_aqui
```

### 3. Executar o Servidor de Desenvolvimento
```bash
pnpm dev
```
O servidor estará rodando em `http://localhost:8080`.

---

## 🧭 Endpoints e Documentação

### 1. Documentação Interativa REST (Swagger UI)
Com o servidor rodando, acesse:
```plaintext
http://localhost:8080/docs
```
Aqui você poderá testar as chamadas diretamente da interface do Swagger.
- **Busca Shopee (REST)**: `GET /shopee/search?keyword=mouse&limit=5`
- **Busca Magalu (REST)**: `GET /magalu/search?keyword=notebook&limit=5`

### 2. Endpoint do Model Context Protocol (MCP)
Agentes de IA compatíveis com o protocolo MCP se conectam usando o moderno endpoint unificado de transporte HTTP:
- **MCP Endpoint (GET/POST)**: `http://localhost:8080/mcp`

---

## 🐳 Executando com Docker

Oferecemos duas abordagens completas para contêineres:

### 1. Ambiente de Desenvolvimento Local (Docker Compose)
Para rodar a aplicação localmente de forma isolada, com um túnel público automático via **Ngrok** (essencial para que LLMs de nuvem externa se conectem no seu MCP local), execute:

```bash
pnpm docker:dev
```
Este comando executa a orquestração declarada em `dev/docker-compose.dev.yaml`.
- O servidor roda em `http://localhost:3000` na sua máquina local com recarregamento em tempo real (hot-reload ativado via volumes).
- O console do Ngrok estará disponível em `http://localhost:4040` para que você possa copiar a URL pública HTTPS gerada dinamicamente para o túnel.

### 2. Deploy de Produção (Serverless / Cloud Run / ECS)
O arquivo `Dockerfile` na raiz foi projetado com **Multi-Stage Build** de alta performance:
1. **Stage 1 (Builder)**: Instala as dependências de compilação, copia o código e utiliza `esbuild` para gerar um bundle único de produção otimizado (`dist/server.js`).
2. **Stage 2 (Deps)**: Instala exclusivamente as dependências necessárias para a produção.
3. **Stage 3 (Runner)**: Cria um ambiente Node Alpine limpo, define um usuário sem privilégios de root por razões de segurança e executa o bundle otimizado.

---

## ⚙️ Scripts Disponíveis

No arquivo `package.json` estão disponíveis os seguintes comandos utilitários:

- `pnpm dev` — Executa o servidor de desenvolvimento localmente na porta 8080 via `tsx` com reinicialização rápida.
- `pnpm build` — Compila os arquivos TypeScript para a pasta `dist/` usando o compilador nativo `tsc`.
- `pnpm start` — Executa os arquivos compilados da pasta `dist/server.js` usando o runtime do Node.js.
- `pnpm docker:dev` — Inicializa todo o ecossistema de desenvolvimento (API com porta 3000, banco Postgres e túnel Ngrok) via Docker Compose.
