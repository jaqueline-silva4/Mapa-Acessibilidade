import { prisma } from "../db/prisma.js";
import { isValidCnpj, normalizeCnpj } from "../utils/cnpj.js";
import { isValidEmail } from "../utils/email.js";
import { generateTemporaryPassword, hashPassword } from "../utils/password.js";
import { AuthError } from "./auth.service.js";

export interface InstitutionCredentialsInput {
  cnpj: string;
  name: string;
  email: string;
}

export interface InstitutionCredentials {
  login: string;
  temporaryPassword: string;
  created: boolean;
}

// UC04 / RN02: gera o identificador de acesso (o CNPJ) e uma senha provisória.
// Se a instituição já tem acesso, uma nova senha provisória é gerada (reemissão).
// A senha em texto puro só existe nesta resposta: no banco fica apenas o hash.
export async function generateInstitutionCredentials(
  input: InstitutionCredentialsInput,
): Promise<InstitutionCredentials> {
  const login = normalizeCnpj(input.cnpj);
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!isValidCnpj(login)) throw new AuthError(400, "CNPJ inválido.");
  if (!name) throw new AuthError(400, "Informe o nome da instituição.");
  if (!isValidEmail(email)) throw new AuthError(400, "E-mail inválido.");

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const existing = await prisma.user.findUnique({ where: { login } });

  if (existing) {
    if (existing.role !== "INSTITUTION") {
      throw new AuthError(409, "Este login pertence a uma conta que não é de instituição.");
    }

    // Reemissão: novo acesso provisório e conta destravada. O status (ex.: suspensa) é mantido.
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, isTemporaryPassword: true, failedLoginAttempts: 0, lockedUntil: null },
    });
    return { login, temporaryPassword, created: false };
  }

  const emailInUse = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (emailInUse) throw new AuthError(409, "Este e-mail já está em uso por outra conta.");

  await prisma.user.create({
    data: { login, name, email, passwordHash, role: "INSTITUTION", isTemporaryPassword: true },
  });
  return { login, temporaryPassword, created: true };
}
