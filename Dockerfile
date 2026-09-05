# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache build-base

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

# Bundle the backend code using esbuild
RUN pnpm dlx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# Stage 2: Install production dependencies only
FROM node:22-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile --prod

# Stage 3: Runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -S app && adduser -S -G app app

ENV NODE_ENV=production

COPY --from=deps    --chown=app:app /app/node_modules   ./node_modules
COPY --from=builder --chown=app:app /app/dist           ./dist

EXPOSE 3000

USER app

CMD [ "node", "dist/server.js" ]
