import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend rodando com sucesso!" });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

