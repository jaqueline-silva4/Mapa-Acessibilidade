import dotenv from "dotenv";
dotenv.config({ override: true });

import { prisma } from "./db/prisma.js";

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected, DATABASE() as current_db, VERSION() as mysql_version`;
    console.log("CONEXAO COM O BANCO DE DADOS REALIZADA COM SUCESSO!");
    console.log("Resultado da consulta:", result);
  } catch (error: any) {
    console.error("Falha ao conectar no banco de dados:", error);
    if (error?.meta?.driverAdapterError?.cause) {
      console.error("Driver cause:", error.meta.driverAdapterError.cause);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
