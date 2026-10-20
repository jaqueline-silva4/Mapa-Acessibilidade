import dotenv from "dotenv";
dotenv.config({ override: true });

import { defineConfig } from "prisma/config";

const dbHost = process.env["DB_HOST"] || "localhost";
const dbPort = process.env["DB_PORT"] || "3305";
const dbUser = process.env["DB_USER"] || "root";
const dbPassword = process.env["DB_PASSWORD"] || "rootpassword";
const dbName = process.env["DB_NAME"] || "mapa_acessibilidade";

const databaseUrl =
  process.env["DATABASE_URL"] && !process.env["DATABASE_URL"].includes("${")
    ? process.env["DATABASE_URL"]
    : `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?allowPublicKeyRetrieval=true`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
