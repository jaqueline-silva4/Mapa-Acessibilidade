import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate, authorize, requirePasswordChanged } from "../../src/middlewares/auth.js";
import { signToken } from "../../src/utils/jwt.js";

// Cria um req/res falsos. O res.status() devolve o próprio res, como no Express.
function createMocks(authorization?: string) {
  const req = { headers: { authorization } } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn();
  return { req, res, next };
}

describe("authenticate", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "segredo-de-teste");
    vi.stubEnv("JWT_EXPIRES_IN", "1h");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responde 401 quando não há cabeçalho Authorization", () => {
    const { req, res, next } = createMocks();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 quando o cabeçalho não começa com 'Bearer '", () => {
    const { req, res, next } = createMocks("Basic abc123");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 quando o token é inválido", () => {
    const { req, res, next } = createMocks("Bearer token-falso");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 quando o token está expirado", () => {
    vi.stubEnv("JWT_EXPIRES_IN", "-1s");
    const token = signToken({ sub: "1", role: "ADMIN", isTemporaryPassword: false });
    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("com token válido, preenche req.user e chama next()", () => {
    const token = signToken({ sub: "7", role: "INSTITUTION", isTemporaryPassword: true });
    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(req.user).toMatchObject({ sub: "7", role: "INSTITUTION", isTemporaryPassword: true });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("authorize", () => {
  const withUser = (role: "ADMIN" | "INSTITUTION") => {
    const mocks = createMocks();
    mocks.req.user = { sub: "1", role, isTemporaryPassword: false };
    return mocks;
  };

  it("responde 401 quando não há req.user (authenticate não rodou)", () => {
    const { req, res, next } = createMocks();

    authorize("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 quando o papel não está na lista", () => {
    const { req, res, next } = withUser("INSTITUTION");

    authorize("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("chama next() quando o papel está na lista", () => {
    const { req, res, next } = withUser("ADMIN");

    authorize("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each(["ADMIN", "INSTITUTION"] as const)("aceita %s quando a lista tem os dois papéis", (role) => {
    const { req, res, next } = withUser(role);

    authorize("ADMIN", "INSTITUTION")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("requirePasswordChanged", () => {
  const withUser = (isTemporaryPassword: boolean) => {
    const mocks = createMocks();
    mocks.req.user = { sub: "1", role: "INSTITUTION", isTemporaryPassword };
    return mocks;
  };

  it("responde 401 quando não há req.user", () => {
    const { req, res, next } = createMocks();

    requirePasswordChanged(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 enquanto a senha ainda é provisória", () => {
    const { req, res, next } = withUser(true);

    requirePasswordChanged(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("chama next() depois que a senha foi trocada", () => {
    const { req, res, next } = withUser(false);

    requirePasswordChanged(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
