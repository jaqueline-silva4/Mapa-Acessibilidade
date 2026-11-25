#!/bin/sh
set -e

echo "Sincronizando schema do banco de dados..."
npx prisma db push

echo "Executando seed das categorias de acessibilidade..."
npx tsx prisma/seed.ts

echo "Iniciando servidor Acessa+..."
exec node dist/server.js
