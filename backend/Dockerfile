FROM node:22-alpine

WORKDIR /app

# Instala OpenSSL para o Prisma Client
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate && npm run build

COPY docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh && mkdir -p /app/uploads

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
