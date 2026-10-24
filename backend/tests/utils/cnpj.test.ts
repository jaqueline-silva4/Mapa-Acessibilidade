import { describe, expect, it } from "vitest";
import { isValidCnpj, normalizeCnpj, normalizeLogin } from "../../src/utils/cnpj.js";

describe("cnpj", () => {
  it("remove a máscara", () => {
    expect(normalizeCnpj("11.222.333/0001-81")).toBe("11222333000181");
  });

  it.each(["11.222.333/0001-81", "11222333000181"])("aceita CNPJ válido: %s", (cnpj) => {
    expect(isValidCnpj(cnpj)).toBe(true);
  });

  it.each(["11.222.333/0001-82", "11111111111111", "123", ""])(
    "rejeita CNPJ inválido: '%s'",
    (cnpj) => {
      expect(isValidCnpj(cnpj)).toBe(false);
    },
  );

  it("normalizeLogin converte CNPJ com máscara para só dígitos", () => {
    expect(normalizeLogin("11.222.333/0001-81")).toBe("11222333000181");
  });

  it("normalizeLogin mantém login de admin em minúsculas e sem espaços", () => {
    expect(normalizeLogin("  Admin ")).toBe("admin");
  });
});
