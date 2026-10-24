import { describe, expect, it } from "vitest";
import {
  generateTemporaryPassword,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../../src/utils/password.js";

describe("validatePasswordStrength", () => {
  const user = { email: "ana@exemplo.com", name: "Ana Souza" };

  it("aceita senha forte", () => {
    expect(validatePasswordStrength("Forte#2026x", user)).toEqual([]);
  });

  it("rejeita senha curta", () => {
    expect(validatePasswordStrength("Ab1#", user)).toContain(
      "A senha deve ter pelo menos 8 caracteres.",
    );
  });

  it.each([
    ["sem maiúscula", "forte#2026x"],
    ["sem minúscula", "FORTE#2026X"],
    ["sem número", "Forte#Senhax"],
    ["sem símbolo", "Forte2026xx"],
  ])("rejeita senha %s", (_caso, senha) => {
    expect(validatePasswordStrength(senha, user).length).toBeGreaterThan(0);
  });

  it("rejeita senha que contém o nome", () => {
    expect(validatePasswordStrength("Souza#2026x", user)).toContain(
      "A senha não pode conter o seu nome ou e-mail.",
    );
  });

  it("rejeita senha que contém o e-mail", () => {
    expect(validatePasswordStrength("Ana@exemplo.com1", user).length).toBeGreaterThan(0);
  });
});

describe("hash de senha", () => {
  it("verifica a senha correta e rejeita a errada", async () => {
    const hash = await hashPassword("Forte#2026x");
    expect(hash).not.toBe("Forte#2026x");
    expect(await verifyPassword("Forte#2026x", hash)).toBe(true);
    expect(await verifyPassword("Outra#2026x", hash)).toBe(false);
  });
});

describe("generateTemporaryPassword", () => {
  it("sempre gera senha válida de 12 caracteres e diferente a cada chamada", () => {
    const senhas = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const senha = generateTemporaryPassword();
      expect(senha).toHaveLength(12);
      expect(validatePasswordStrength(senha)).toEqual([]);
      senhas.add(senha);
    }
    expect(senhas.size).toBe(100);
  });
});
