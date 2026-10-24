import type { Response } from "express";
import { AuthError } from "../services/auth.service.js";

// Erros previstos (AuthError) viram a resposta HTTP deles; o resto vira 500 genérico,
// sem vazar detalhes internos (o erro real vai só para o log).
export function sendError(res: Response, error: unknown): void {
  if (error instanceof AuthError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Erro interno. Tente novamente mais tarde." });
}
