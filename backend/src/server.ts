import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import { prisma } from "./db/prisma.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import path from "node:path";
import { categoriesRouter, institutionPointsRouter, publicPointsRouter } from "./modules/points/points.routes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/api/institution/points", institutionPointsRouter);
app.use("/api/institutions", publicPointsRouter);
app.use("/api/accessibility-categories", categoriesRouter);
app.use("/api/admin", adminRouter);

// Rota raiz inicial
app.get("/", async (_req, res) => {
  let isDbConnected = false;
  try {
    const dbCheck = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected`;
    isDbConnected = Boolean(dbCheck && dbCheck.length > 0);
  } catch {
    isDbConnected = false;
  }

  res.json({
    projeto: "Mapa Acessibilidade API",
    status: "online",
    database: isDbConnected ? "connected" : "disconnected",
    endpoints: {
      health: "/api/health",
    },
  });
});

// Rota de verificação de integridade (Health Check)
app.get("/api/health", async (_req, res) => {
  try {
    const dbCheck = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected`;
    const isDbConnected = Boolean(dbCheck && dbCheck.length > 0);

    res.json({
      status: "ok",
      message: "Backend rodando com sucesso!",
      database: isDbConnected ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Falha na conexão com o banco de dados",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(port, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Banco de dados conectado com sucesso! (MySQL na porta ${process.env.DB_PORT || 3305})`);
  } catch (error) {
    console.error(`❌ Falha ao conectar no banco de dados:`, error instanceof Error ? error.message : error);
  }
});
