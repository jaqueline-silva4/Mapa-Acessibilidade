import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Os services são trocados por versões falsas; o AuthError continua o verdadeiro.
vi.mock("../../src/services/auth.service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/services/auth.service.js")>();
  return {
    ...actual,
    login: vi.fn(),
    changeTemporaryPassword: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  };
});

import { authRouter } from "../../src/routes/auth.routes.js";
import {
  AuthError,
  changeTemporaryPassword,
  login,
  requestPasswordReset,
  resetPassword,
} from "../../src/services/auth.service.js";
import { signToken } from "../../src/utils/jwt.js";

// Um app mínimo só com o router de auth, sem subir o servidor nem o banco.
const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "segredo-de-teste");
  vi.stubEnv("JWT_EXPIRES_IN", "1h");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("200 com token e usuário quando o login dá certo", async () => {
    const resultado = {
      token: "jwt-falso",
      user: { id: 7, name: "Instituição", role: "INSTITUTION", isTemporaryPassword: true },
    };
    vi.mocked(login).mockResolvedValue(resultado as never);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "11.222.333/0001-81", password: "Forte#2026x" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(resultado);
    expect(login).toHaveBeenCalledWith("11.222.333/0001-81", "Forte#2026x");
  });

  it.each([
    ["corpo vazio", {}],
    ["sem senha", { login: "11222333000181" }],
    ["sem login", { password: "Forte#2026x" }],
    ["login em branco", { login: "   ", password: "Forte#2026x" }],
    ["tipos errados", { login: 123, password: true }],
  ])("400 quando o corpo é inválido: %s", async (_caso, corpo) => {
    const res = await request(app).post("/api/auth/login").send(corpo);

    expect(res.status).toBe(400);
    expect(login).not.toHaveBeenCalled();
  });

  it("repassa o status e a mensagem do AuthError (401)", async () => {
    vi.mocked(login).mockRejectedValue(new AuthError(401, "Usuário ou senha inválidos."));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "11222333000181", password: "errada" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Usuário ou senha inválidos." });
  });

  it("repassa o 423 quando a conta está bloqueada", async () => {
    vi.mocked(login).mockRejectedValue(new AuthError(423, "Limite de tentativas excedido."));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "11222333000181", password: "qualquer" });

    expect(res.status).toBe(423);
  });

  it("500 genérico para erro inesperado, sem vazar detalhes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(login).mockRejectedValue(new Error("falha secreta no banco"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "11222333000181", password: "qualquer" });

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("falha secreta");
  });
});

describe("POST /api/auth/change-temporary-password", () => {
  // Aqui o authenticate é o verdadeiro: o token precisa ser válido.
  const tokenProvisorio = () =>
    signToken({ sub: "7", role: "INSTITUTION", isTemporaryPassword: true });

  it("401 sem token", async () => {
    const res = await request(app)
      .post("/api/auth/change-temporary-password")
      .send({ newPassword: "Nova#Senha2026" });

    expect(res.status).toBe(401);
    expect(changeTemporaryPassword).not.toHaveBeenCalled();
  });

  it("aceita quem ainda tem senha provisória (não exige requirePasswordChanged)", async () => {
    const resultado = { token: "novo", user: { id: 7, isTemporaryPassword: false } };
    vi.mocked(changeTemporaryPassword).mockResolvedValue(resultado as never);

    const res = await request(app)
      .post("/api/auth/change-temporary-password")
      .set("Authorization", `Bearer ${tokenProvisorio()}`)
      .send({ newPassword: "Nova#Senha2026" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(resultado);
    expect(changeTemporaryPassword).toHaveBeenCalledWith(7, "Nova#Senha2026");
  });

  it("400 sem a nova senha", async () => {
    const res = await request(app)
      .post("/api/auth/change-temporary-password")
      .set("Authorization", `Bearer ${tokenProvisorio()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(changeTemporaryPassword).not.toHaveBeenCalled();
  });

  it("repassa o erro do service (senha fraca)", async () => {
    vi.mocked(changeTemporaryPassword).mockRejectedValue(
      new AuthError(400, "A senha deve ter um símbolo."),
    );

    const res = await request(app)
      .post("/api/auth/change-temporary-password")
      .set("Authorization", `Bearer ${tokenProvisorio()}`)
      .send({ newPassword: "SemSimbolo2026" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/símbolo/);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("200 com mensagem genérica e chama o service", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "contato@teste.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Se o e-mail estiver cadastrado/);
    expect(requestPasswordReset).toHaveBeenCalledWith("contato@teste.com");
  });

  it("a resposta é idêntica exista o e-mail ou não", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);

    const a = await request(app).post("/api/auth/forgot-password").send({ email: "existe@teste.com" });
    const b = await request(app).post("/api/auth/forgot-password").send({ email: "nao-existe@teste.com" });

    expect(a.status).toBe(b.status);
    expect(a.body).toEqual(b.body);
  });

  it("400 sem e-mail", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});

    expect(res.status).toBe(400);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/reset-password", () => {
  it("200 quando a senha é redefinida", async () => {
    vi.mocked(resetPassword).mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "abc", newPassword: "Nova#Senha2026" });

    expect(res.status).toBe(200);
    expect(resetPassword).toHaveBeenCalledWith("abc", "Nova#Senha2026");
  });

  it.each([
    ["sem token", { newPassword: "Nova#Senha2026" }],
    ["sem senha", { token: "abc" }],
  ])("400 %s", async (_caso, corpo) => {
    const res = await request(app).post("/api/auth/reset-password").send(corpo);

    expect(res.status).toBe(400);
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("repassa o 400 de token inválido ou expirado", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      new AuthError(400, "Link de recuperação inválido ou expirado."),
    );

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "velho", newPassword: "Nova#Senha2026" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/inválido ou expirado/);
  });
});
