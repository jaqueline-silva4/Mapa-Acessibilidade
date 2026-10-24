import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import {
  changeTemporaryPassword,
  login,
  requestPasswordReset,
  resetPassword,
} from "../services/auth.service.js";
import { sendError } from "./http-error.js";

const loginSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({ newPassword: z.string().min(1) });
const forgotPasswordSchema = z.object({ email: z.string().trim().min(1) });
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ message: "Informe o login e a senha." });
    return;
  }

  try {
    res.json(await login(body.data.login, body.data.password));
  } catch (error) {
    sendError(res, error);
  }
});

// Só authenticate, de propósito: quem tem senha provisória precisa conseguir chegar aqui.
authRouter.post("/change-temporary-password", authenticate, async (req, res) => {
  const body = changePasswordSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ message: "Informe a nova senha." });
    return;
  }

  try {
    res.json(await changeTemporaryPassword(Number(req.user!.sub), body.data.newPassword));
  } catch (error) {
    sendError(res, error);
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  const body = forgotPasswordSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ message: "Informe o e-mail cadastrado." });
    return;
  }

  try {
    await requestPasswordReset(body.data.email);
    // Mesma resposta exista o e-mail ou não, para não revelar quem tem cadastro.
    res.json({ message: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha." });
  } catch (error) {
    sendError(res, error);
  }
});

authRouter.post("/reset-password", async (req, res) => {
  const body = resetPasswordSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ message: "Informe o token e a nova senha." });
    return;
  }

  try {
    await resetPassword(body.data.token, body.data.newPassword);
    res.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    sendError(res, error);
  }
});
