FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
