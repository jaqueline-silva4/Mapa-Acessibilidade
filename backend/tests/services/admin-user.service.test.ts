import { afterEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), create: vi.fn() },
}));
vi.mock("../../src/db/prisma.js", () => ({ prisma: prismaMock }));

import { createAdminUser } from "../../src/services/admin-user.service.js";
import { verifyPassword } from "../../src/utils/password.js";

const entradaValida = {
  login: "  Admin ",
  name: "Maria Admin",
  email: "  Maria@Exemplo.com ",
  password: "Forte#2026x",
};

describe("createAdminUser", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cria o admin com login e e-mail normalizados e senha em hash", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 1, login: "admin" });

    const admin = await createAdminUser(entradaValida);

    expect(admin).toEqual({ id: 1, login: "admin" });
    const { data } = prismaMock.user.create.mock.calls[0]![0];
    expect(data).toMatchObject({
      login: "admin",
      name: "Maria Admin",
      email: "maria@exemplo.com",
      role: "ADMIN",
      isTemporaryPassword: false,
    });
    expect(data.passwordHash).not.toBe("Forte#2026x");
    expect(await verifyPassword("Forte#2026x", data.passwordHash)).toBe(true);
  });

  it("rejeita senha fraca sem tocar no banco", async () => {
    await expect(createAdminUser({ ...entradaValida, password: "123" })).rejects.toThrow(
      /senha/i,
    );
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejeita senha que contém o nome", async () => {
    await expect(
      createAdminUser({ ...entradaValida, password: "Maria#2026x" }),
    ).rejects.toThrow(/nome ou e-mail/);
  });

  it("rejeita e-mail inválido", async () => {
    await expect(createAdminUser({ ...entradaValida, email: "sem-arroba" })).rejects.toThrow(
      "E-mail inválido.",
    );
  });

  it.each([
    ["login", { login: "  " }],
    ["nome", { name: "  " }],
  ])("rejeita %s em branco", async (_campo, alteracao) => {
    await expect(createAdminUser({ ...entradaValida, ...alteracao })).rejects.toThrow();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejeita login ou e-mail já cadastrado", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 9 });

    await expect(createAdminUser(entradaValida)).rejects.toThrow("Já existe um usuário");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});
