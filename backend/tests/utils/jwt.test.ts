import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signToken, verifyToken } from "../../src/utils/jwt.js";

describe("jwt", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "segredo-de-teste");
    vi.stubEnv("JWT_EXPIRES_IN", "1h");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("assina e verifica mantendo o payload", () => {
    const token = signToken({ sub: "7", role: "INSTITUTION", isTemporaryPassword: true });
    expect(verifyToken(token)).toMatchObject({
      sub: "7",
      role: "INSTITUTION",
      isTemporaryPassword: true,
    });
  });

  it("rejeita token assinado com outro segredo", () => {
    const token = signToken({ sub: "1", role: "ADMIN", isTemporaryPassword: false });
    vi.stubEnv("JWT_SECRET", "outro-segredo");
    expect(() => verifyToken(token)).toThrow();
  });

  it("rejeita token expirado", () => {
    vi.stubEnv("JWT_EXPIRES_IN", "-1s");
    const token = signToken({ sub: "1", role: "ADMIN", isTemporaryPassword: false });
    expect(() => verifyToken(token)).toThrow(/expired/i);
  });

  it("falha se JWT_SECRET não estiver definido", () => {
    vi.stubEnv("JWT_SECRET", "");
    expect(() =>
      signToken({ sub: "1", role: "ADMIN", isTemporaryPassword: false }),
    ).toThrow("JWT_SECRET");
  });
});
