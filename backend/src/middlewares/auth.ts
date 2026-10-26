import type { NextFunction, Request, Response } from "express";
import { verifyToken, type Role } from "../utils/jwt.js";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token de acesso não informado." });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Token inválido ou expirado." });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Não autenticado." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Você não tem permissão para acessar este recurso." });
      return;
    }

    next();
  };
}

// Bloqueia quem ainda usa a senha provisória (RN03). Deve vir depois do authenticate.
// Não use nesta rota: POST /api/auth/change-temporary-password.
export function requirePasswordChanged(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado." });
    return;
  }

  if (req.user.isTemporaryPassword) {
    res.status(403).json({ message: "É necessário trocar a senha provisória antes de continuar." });
    return;
  }

  next();
}
