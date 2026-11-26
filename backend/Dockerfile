FROM node:22-bookworm-slim

WORKDIR /app

# Instala OpenSSL para o Prisma Client
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci || npm install --no-audit --no-fund

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate && npm run build

COPY docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh && mkdir -p /app/uploads

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
