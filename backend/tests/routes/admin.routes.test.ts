import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/services/institution-credentials.service.js", () => ({
  generateInstitutionCredentials: vi.fn(),
}));

import { adminRouter } from "../../src/routes/admin.routes.js";
import { AuthError } from "../../src/services/auth.service.js";
import { generateInstitutionCredentials } from "../../src/services/institution-credentials.service.js";
import { signToken } from "../../src/utils/jwt.js";

const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);

const URL = "/api/admin/institutions/3/credentials";
const corpo = { cnpj: "11.222.333/0001-81", name: "Instituição Teste", email: "contato@teste.com" };

const tokenDe = (role: "ADMIN" | "INSTITUTION", isTemporaryPassword = false) =>
  signToken({ sub: "1", role, isTemporaryPassword });

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "segredo-de-teste");
  vi.stubEnv("JWT_EXPIRES_IN", "1h");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("controle de acesso em /api/admin (RBAC)", () => {
  it("401 sem token", async () => {
    const res = await request(app).post(URL).send(corpo);

    expect(res.status).toBe(401);
    expect(generateInstitutionCredentials).not.toHaveBeenCalled();
  });

  it("403 para uma instituição", async () => {
    const res = await request(app)
      .post(URL)
      .set("Authorization", `Bearer ${tokenDe("INSTITUTION")}`)
      .send(corpo);

    expect(res.status).toBe(403);
    expect(generateInstitutionCredentials).not.toHaveBeenCalled();
  });

  it("403 para um admin que ainda não trocou a senha provisória", async () => {
    const res = await request(app)
      .post(URL)
      .set("Authorization", `Bearer ${tokenDe("ADMIN", true)}`)
      .send(corpo);

    expect(res.status).toBe(403);
    expect(generateInstitutionCredentials).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/institutions/:id/credentials", () => {
  const comoAdmin = (body: object, url = URL) =>
    request(app).post(url).set("Authorization", `Bearer ${tokenDe("ADMIN")}`).send(body);

  it("201 com login e senha provisória quando a instituição é nova", async () => {
    vi.mocked(generateInstitutionCredentials).mockResolvedValue({
      login: "11222333000181",
      temporaryPassword: "Abc#1234xyz",
      created: true,
    });

    const res = await comoAdmin(corpo);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      institutionId: 3,
      login: "11222333000181",
      temporaryPassword: "Abc#1234xyz",
    });
    expect(generateInstitutionCredentials).toHaveBeenCalledWith(corpo);
  });

  it("200 quando é uma reemissão para quem já tinha acesso", async () => {
    vi.mocked(generateInstitutionCredentials).mockResolvedValue({
      login: "11222333000181",
      temporaryPassword: "Abc#1234xyz",
      created: false,
    });

    const res = await comoAdmin(corpo);

    expect(res.status).toBe(200);
  });

  it.each([
    ["sem CNPJ", { name: "X", email: "a@b.com" }],
    ["sem nome", { cnpj: "11222333000181", email: "a@b.com" }],
    ["sem e-mail", { cnpj: "11222333000181", name: "X" }],
  ])("400 %s", async (_caso, body) => {
    const res = await comoAdmin(body);

    expect(res.status).toBe(400);
    expect(generateInstitutionCredentials).not.toHaveBeenCalled();
  });

  it("400 quando o :id não é um número positivo", async () => {
    const res = await comoAdmin(corpo, "/api/admin/institutions/abc/credentials");

    expect(res.status).toBe(400);
    expect(generateInstitutionCredentials).not.toHaveBeenCalled();
  });

  it("repassa o 409 do service", async () => {
    vi.mocked(generateInstitutionCredentials).mockRejectedValue(
      new AuthError(409, "Este e-mail já está em uso por outra conta."),
    );

    const res = await comoAdmin(corpo);

    expect(res.status).toBe(409);
  });
});
