import { afterEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock("../../src/db/prisma.js", () => ({ prisma: prismaMock }));

import { AuthError } from "../../src/services/auth.service.js";
import { generateInstitutionCredentials } from "../../src/services/institution-credentials.service.js";
import { validatePasswordStrength, verifyPassword } from "../../src/utils/password.js";

const entrada = {
  cnpj: "11.222.333/0001-81",
  name: "  Instituição Teste ",
  email: "  Contato@Teste.com ",
};

async function catchError(promise: Promise<unknown>): Promise<AuthError> {
  try {
    await promise;
  } catch (error) {
    return error as AuthError;
  }
  throw new Error("Era esperado que a função lançasse um erro.");
}

describe("generateInstitutionCredentials", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cria a instituição com o CNPJ como login e senha provisória válida", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({});

    const result = await generateInstitutionCredentials(entrada);

    expect(result).toMatchObject({ login: "11222333000181", created: true });
    expect(validatePasswordStrength(result.temporaryPassword)).toEqual([]);

    const { data } = prismaMock.user.create.mock.calls[0]![0];
    expect(data).toMatchObject({
      login: "11222333000181",
      name: "Instituição Teste",
      email: "contato@teste.com",
      role: "INSTITUTION",
      isTemporaryPassword: true,
    });
    expect(data.passwordHash).not.toBe(result.temporaryPassword);
    expect(await verifyPassword(result.temporaryPassword, data.passwordHash)).toBe(true);
  });

  it("reemite a senha provisória e destrava a conta de quem já tem acesso", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 5, role: "INSTITUTION" });
    prismaMock.user.update.mockResolvedValue({});

    const result = await generateInstitutionCredentials(entrada);

    expect(result.created).toBe(false);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    const { where, data } = prismaMock.user.update.mock.calls[0]![0];
    expect(where).toEqual({ id: 5 });
    expect(data).toMatchObject({
      isTemporaryPassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    expect(data).not.toHaveProperty("status");
    expect(await verifyPassword(result.temporaryPassword, data.passwordHash)).toBe(true);
  });

  it("409 quando o CNPJ já é login de uma conta que não é de instituição", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, role: "ADMIN" });

    const error = await catchError(generateInstitutionCredentials(entrada));

    expect(error.status).toBe(409);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("409 quando o e-mail já pertence a outra conta", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null) // busca por login
      .mockResolvedValueOnce({ id: 9 }); // busca por e-mail

    const error = await catchError(generateInstitutionCredentials(entrada));

    expect(error.status).toBe(409);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it.each([
    ["CNPJ inválido", { cnpj: "11.222.333/0001-82" }],
    ["nome em branco", { name: "  " }],
    ["e-mail inválido", { email: "sem-arroba" }],
  ])("400 para %s, sem tocar no banco", async (_caso, alteracao) => {
    const error = await catchError(generateInstitutionCredentials({ ...entrada, ...alteracao }));

    expect(error.status).toBe(400);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
