import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";

// Erro previsto da API de pontos: vira a resposta HTTP com o status informado.
export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Registrado no fim de cada router de pontos (Express 5 já envia erros de handlers async para cá).
export function pointsErrorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Dados inválidos.",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ message: "Cada imagem deve ter no máximo 5 MB." });
      return;
    }
    if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({ message: 'Envie no máximo 5 imagens, no campo "images".' });
      return;
    }
    res.status(400).json({ message: "Erro no envio do arquivo." });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Erro interno. Tente novamente mais tarde." });
}