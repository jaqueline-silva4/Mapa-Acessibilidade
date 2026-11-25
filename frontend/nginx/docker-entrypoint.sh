#!/bin/sh
set -e

if [ -z "${DOMAIN}" ]; then
  echo "ERRO: A variável DOMAIN deve ser definida no arquivo .env."
  exit 1
fi

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
FULLCHAIN="${CERT_DIR}/fullchain.pem"
PRIVKEY="${CERT_DIR}/privkey.pem"

mkdir -p /var/www/certbot "${CERT_DIR}"

# Cria certificado temporário autoassinado na primeira subida para o Nginx iniciar
# e responder ao desafio ACME do Certbot em /.well-known/acme-challenge/
if [ ! -f "${FULLCHAIN}" ] || [ ! -f "${PRIVKEY}" ]; then
  echo "Gerando certificado TLS temporário inicial para ${DOMAIN}..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${PRIVKEY}" \
    -out "${FULLCHAIN}" \
    -subj "/CN=${DOMAIN}" >/dev/null 2>&1
fi

envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Recarrega o Nginx periodicamente (a cada 6h e logo após emissão inicial) para aplicar o certificado Let's Encrypt
(
  sleep 25
  nginx -s reload >/dev/null 2>&1 || true
  while :; do
    sleep 6h
    nginx -s reload >/dev/null 2>&1 || true
  done
) &

exec nginx -g "daemon off;"
