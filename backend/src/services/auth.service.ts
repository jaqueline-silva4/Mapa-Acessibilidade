import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db/prisma.js";
import { normalizeLogin } from "../utils/cnpj.js";
import { signToken, type Role } from "../utils/jwt.js";
import { sendMail } from "../utils/mailer.js";
import { hashPassword, validatePasswordStrength, verifyPassword } from "../utils/password.js";

const MAX_FAILED_ATTEMPTS = 5; // RN06
const LOCK_MINUTES = 15; // RN06
const RESET_TOKEN_HOURS = 1; // RN05

const INVALID_CREDENTIALS = "Usuário ou senha inválidos.";
const ACCOUNT_LOCKED = "Limite de tentativas excedido. Tente novamente em 15 minutos.";
const INVALID_RESET_TOKEN = "Link de recuperação inválido ou expirado.";

// Hash bcrypt de uma senha descartável. Quando o login não existe, comparamos a senha
// com ele só para gastar o mesmo tempo e não revelar quais logins estão cadastrados.
const DUMMY_HASH = "$2b$10$0nt/aOD517Gra9e6S0T0uO4cpw7BHUgr1h2O2mfiRwO2jCiHwdZYm";

export class AuthError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    name: string;
    role: Role;
    isTemporaryPassword: boolean;
  };
}

function buildLoginResult(user: {
  id: number;
  name: string;
  role: Role;
  isTemporaryPassword: boolean;
}): LoginResult {
  const token = signToken({
    sub: String(user.id),
    role: user.role,
    isTemporaryPassword: user.isTemporaryPassword,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
    },
  };
}

// O token enviado por e-mail nunca é gravado: no banco fica só o hash dele.
function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function login(rawLogin: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { login: normalizeLogin(rawLogin) } });

  // Login inexistente, conta inativa e conta suspensa recebem a mesma resposta (UC01, FE01).
  if (!user || user.status !== "ACTIVE") {
    await verifyPassword(password, DUMMY_HASH);
    throw new AuthError(401, INVALID_CREDENTIALS);
  }

  // A conta bloqueada é checada antes da senha, para quem está bloqueado
  // não conseguir descobrir se acertou (UC01, FE02).
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError(423, ACCOUNT_LOCKED);
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    // increment é atômico: duas tentativas simultâneas contam as duas.
    const { failedLoginAttempts } = await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });

    if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000),
        },
      });

      await sendMail({
        to: user.email,
        subject: "Sua conta foi bloqueada temporariamente",
        text:
          `Olá, ${user.name}.\n\n` +
          `Houve ${MAX_FAILED_ATTEMPTS} tentativas seguidas de acesso com senha incorreta, ` +
          `por isso sua conta foi bloqueada por ${LOCK_MINUTES} minutos.\n` +
          `Se não foi você, redefina sua senha assim que o acesso for liberado.`,
      }).catch((error) => console.error("Falha ao enviar aviso de bloqueio:", error));

      throw new AuthError(423, ACCOUNT_LOCKED);
    }

    throw new AuthError(401, INVALID_CREDENTIALS);
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  return buildLoginResult(user);
}

// RN03: no primeiro acesso a instituição precisa trocar a senha provisória.
export async function changeTemporaryPassword(
  userId: number,
  newPassword: string,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.status !== "ACTIVE") {
    throw new AuthError(401, "Não autenticado.");
  }
  if (!user.isTemporaryPassword) {
    throw new AuthError(409, "A senha provisória já foi trocada.");
  }

  const errors = validatePasswordStrength(newPassword, { email: user.email, name: user.name });
  if (errors.length > 0) throw new AuthError(400, errors.join(" "));

  if (await verifyPassword(newPassword, user.passwordHash)) {
    throw new AuthError(400, "A nova senha deve ser diferente da senha provisória.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), isTemporaryPassword: false },
  });

  // Token novo, já sem a marca de senha provisória.
  return buildLoginResult({ ...user, isTemporaryPassword: false });
}

// RN05: o link vale 1 hora e só pode ser usado uma vez.
// Não devolve nada: a resposta é a mesma exista o e-mail ou não.
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.status !== "ACTIVE") return;

  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    // um pedido novo invalida os anteriores que ainda não foram usados
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60_000),
      },
    }),
  ]);

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const link = `${frontendUrl}/redefinir-senha?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "Recuperação de senha",
    text:
      `Olá, ${user.name}.\n\n` +
      `Para criar uma nova senha, acesse o link abaixo. Ele vale por ${RESET_TOKEN_HOURS} hora ` +
      `e só pode ser usado uma vez:\n${link}\n\n` +
      `Se você não pediu a recuperação, ignore esta mensagem.`,
  }).catch((error) => console.error("Falha ao enviar e-mail de recuperação:", error));
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashResetToken(token) },
    include: { user: true },
  });

  if (!record || record.used || record.expiresAt <= new Date() || record.user.status !== "ACTIVE") {
    throw new AuthError(400, INVALID_RESET_TOKEN);
  }

  const errors = validatePasswordStrength(newPassword, {
    email: record.user.email,
    name: record.user.name,
  });
  if (errors.length > 0) throw new AuthError(400, errors.join(" "));

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    // "Reivindica" o token de forma atômica: se duas requisições chegarem juntas,
    // só uma encontra o token ainda não usado.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, used: false, expiresAt: { gt: new Date() } },
      data: { used: true },
    });
    if (claimed.count !== 1) throw new AuthError(400, INVALID_RESET_TOKEN);

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, isTemporaryPassword: false, failedLoginAttempts: 0, lockedUntil: null },
    });
  });
}
