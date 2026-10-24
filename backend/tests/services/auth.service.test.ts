import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// O Prisma é trocado por uma versão falsa: nenhum teste aqui usa o banco.
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  passwordResetToken: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("../../src/db/prisma.js", () => ({ prisma: prismaMock }));

// Nenhum e-mail de verdade é enviado nos testes.
vi.mock("../../src/utils/mailer.js", () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));

// verifyPassword continua real (bcrypt de verdade), mas vira um "espião" para sabermos se foi chamado.
vi.mock("../../src/utils/password.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils/password.js")>();
  return { ...actual, verifyPassword: vi.fn(actual.verifyPassword) };
});

import {
  AuthError,
  changeTemporaryPassword,
  login,
  requestPasswordReset,
  resetPassword,
} from "../../src/services/auth.service.js";
import { verifyToken } from "../../src/utils/jwt.js";
import { sendMail } from "../../src/utils/mailer.js";
import { hashPassword, verifyPassword } from "../../src/utils/password.js";

const CNPJ = "11222333000181";
const SENHA = "Forte#2026x";

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await hashPassword(SENHA);
});

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: "Instituição Teste",
    login: CNPJ,
    email: "contato@teste.com",
    passwordHash,
    role: "INSTITUTION",
    status: "ACTIVE",
    isTemporaryPassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

// Captura o erro lançado para podermos conferir status e mensagem.
async function catchError(promise: Promise<unknown>): Promise<AuthError> {
  try {
    await promise;
  } catch (error) {
    return error as AuthError;
  }
  throw new Error("Era esperado que a função lançasse um erro.");
}

// $transaction aceita uma lista de operações ou uma função; os dois formatos são simulados aqui.
function mockTransaction() {
  prismaMock.$transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === "function" ? arg(prismaMock) : Promise.all(arg as unknown[]),
  );
}

describe("login", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "segredo-de-teste");
    vi.stubEnv("JWT_EXPIRES_IN", "1h");
    prismaMock.user.update.mockResolvedValue({ failedLoginAttempts: 0 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("login inexistente responde 401 e ainda compara a senha (anti-timing)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const error = await catchError(login(CNPJ, SENHA));

    expect(error).toBeInstanceOf(AuthError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Usuário ou senha inválidos.");
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it.each(["INACTIVE", "SUSPENDED"])("conta %s responde 401 com a mesma mensagem", async (status) => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ status }));

    const error = await catchError(login(CNPJ, SENHA));

    expect(error.status).toBe(401);
    expect(error.message).toBe("Usuário ou senha inválidos.");
  });

  it("conta bloqueada responde 423 sem comparar a senha", async () => {
    const lockedUntil = new Date(Date.now() + 5 * 60_000);
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ lockedUntil }));

    const error = await catchError(login(CNPJ, SENHA));

    expect(error.status).toBe(423);
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("bloqueio já vencido não impede o login", async () => {
    const lockedUntil = new Date(Date.now() - 60_000);
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ lockedUntil }));

    const result = await login(CNPJ, SENHA);

    expect(result.token).toBeTruthy();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  it("senha errada incrementa o contador e responde 401", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    prismaMock.user.update.mockResolvedValue({ failedLoginAttempts: 1 });

    const error = await catchError(login(CNPJ, "Errada#2026x"));

    expect(error.status).toBe(401);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
  });

  it("o 5º erro seguido bloqueia por 15 minutos, avisa por e-mail e responde 423", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ failedLoginAttempts: 4 }));
    prismaMock.user.update.mockResolvedValueOnce({ failedLoginAttempts: 5 });
    const antes = Date.now();

    const error = await catchError(login(CNPJ, "Errada#2026x"));

    expect(error.status).toBe(423);
    const bloqueio = prismaMock.user.update.mock.calls[1]![0];
    expect(bloqueio.data.failedLoginAttempts).toBe(0);
    const minutos = (bloqueio.data.lockedUntil.getTime() - antes) / 60_000;
    expect(minutos).toBeGreaterThan(14.9);
    expect(minutos).toBeLessThan(15.1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "contato@teste.com",
        subject: expect.stringContaining("bloqueada"),
      }),
    );
  });

  it("senha certa devolve o token e os dados do usuário, sem o hash", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ isTemporaryPassword: true }));

    const result = await login(CNPJ, SENHA);

    expect(result.user).toEqual({
      id: 7,
      name: "Instituição Teste",
      role: "INSTITUTION",
      isTemporaryPassword: true,
    });
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(verifyToken(result.token)).toMatchObject({
      sub: "7",
      role: "INSTITUTION",
      isTemporaryPassword: true,
    });
  });

  it("senha certa zera o contador de erros", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ failedLoginAttempts: 3 }));

    await login(CNPJ, SENHA);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  it("senha certa sem erros anteriores não escreve no banco", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());

    await login(CNPJ, SENHA);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("CNPJ com máscara busca o login só com dígitos", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());

    await login("11.222.333/0001-81", SENHA);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { login: CNPJ } });
  });
});

describe("changeTemporaryPassword", () => {
  const NOVA = "Nova#Senha2026";

  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "segredo-de-teste");
    vi.stubEnv("JWT_EXPIRES_IN", "1h");
    prismaMock.user.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("troca a senha, tira a marca de provisória e devolve token novo", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ isTemporaryPassword: true }));

    const result = await changeTemporaryPassword(7, NOVA);

    const { data } = prismaMock.user.update.mock.calls[0]![0];
    expect(data.isTemporaryPassword).toBe(false);
    expect(await verifyPassword(NOVA, data.passwordHash)).toBe(true);
    expect(result.user.isTemporaryPassword).toBe(false);
    expect(verifyToken(result.token)).toMatchObject({ sub: "7", isTemporaryPassword: false });
  });

  it("401 quando o usuário não existe ou não está ativo", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ status: "SUSPENDED" }));

    const error = await catchError(changeTemporaryPassword(7, NOVA));

    expect(error.status).toBe(401);
  });

  it("409 quando a senha provisória já foi trocada", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ isTemporaryPassword: false }));

    const error = await catchError(changeTemporaryPassword(7, NOVA));

    expect(error.status).toBe(409);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("400 quando a nova senha é fraca", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ isTemporaryPassword: true }));

    const error = await catchError(changeTemporaryPassword(7, "123"));

    expect(error.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("400 quando a nova senha é igual à provisória", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ isTemporaryPassword: true }));

    const error = await catchError(changeTemporaryPassword(7, SENHA));

    expect(error.status).toBe(400);
    expect(error.message).toMatch(/diferente/);
  });
});

describe("requestPasswordReset", () => {
  beforeEach(() => {
    mockTransaction();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("não faz nada (e não revela) quando o e-mail não existe", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(requestPasswordReset("ninguem@teste.com")).resolves.toBeUndefined();

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("não envia nada para conta inativa", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ status: "INACTIVE" }));

    await requestPasswordReset("contato@teste.com");

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("grava só o HASH do token, com validade de 1 hora, e manda o token no link", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    const antes = Date.now();

    await requestPasswordReset("  Contato@Teste.com ");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "contato@teste.com" },
    });
    expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, used: false },
      data: { used: true },
    });

    const { data } = prismaMock.passwordResetToken.create.mock.calls[0]![0];
    const minutos = (data.expiresAt.getTime() - antes) / 60_000;
    expect(minutos).toBeGreaterThan(59.9);
    expect(minutos).toBeLessThan(60.1);

    const { text } = vi.mocked(sendMail).mock.calls[0]![0];
    const tokenNoLink = /token=([0-9a-f]{64})/.exec(text)![1]!;
    expect(data.token).not.toBe(tokenNoLink);
    expect(data.token).toHaveLength(64);
  });

  it("se o envio do e-mail falhar, não quebra a requisição", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("SMTP fora do ar"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(requestPasswordReset("contato@teste.com")).resolves.toBeUndefined();
  });
});

describe("resetPassword", () => {
  const NOVA = "Nova#Senha2026";
  const registro = (overrides: Record<string, unknown> = {}) => ({
    id: 3,
    userId: 7,
    used: false,
    expiresAt: new Date(Date.now() + 30 * 60_000),
    user: makeUser(),
    ...overrides,
  });

  beforeEach(() => {
    mockTransaction();
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("troca a senha, marca o token como usado e destrava a conta", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(registro());

    await resetPassword("token-que-veio-no-link", NOVA);

    expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 3, used: false }),
        data: { used: true },
      }),
    );
    const { data } = prismaMock.user.update.mock.calls[0]![0];
    expect(await verifyPassword(NOVA, data.passwordHash)).toBe(true);
    expect(data).toMatchObject({
      isTemporaryPassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  });

  it("busca o token pelo hash, e não pelo valor puro", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(registro());

    await resetPassword("token-que-veio-no-link", NOVA);

    const { where } = prismaMock.passwordResetToken.findUnique.mock.calls[0]![0];
    expect(where.token).not.toBe("token-que-veio-no-link");
    expect(where.token).toHaveLength(64);
  });

  it.each([
    ["inexistente", null],
    ["já usado", registro({ used: true })],
    ["expirado", registro({ expiresAt: new Date(Date.now() - 1000) })],
    ["de conta inativa", registro({ user: makeUser({ status: "INACTIVE" }) })],
  ])("400 para token %s, sem alterar nada", async (_caso, encontrado) => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(encontrado);

    const error = await catchError(resetPassword("qualquer", NOVA));

    expect(error.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("senha fraca dá 400 e NÃO consome o token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(registro());

    const error = await catchError(resetPassword("qualquer", "123"));

    expect(error.status).toBe(400);
    expect(prismaMock.passwordResetToken.updateMany).not.toHaveBeenCalled();
  });

  it("400 quando outra requisição já consumiu o token (corrida)", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(registro());
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    const error = await catchError(resetPassword("qualquer", NOVA));

    expect(error.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
