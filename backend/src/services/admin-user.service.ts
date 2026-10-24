import { prisma } from "../db/prisma.js";
import { normalizeLogin } from "../utils/cnpj.js";
import { isValidEmail } from "../utils/email.js";
import { hashPassword, validatePasswordStrength } from "../utils/password.js";

export interface CreateAdminInput {
  login: string;
  name: string;
  email: string;
  password: string;
}

// O acesso administrativo só nasce por aqui (script da equipe de TI), nunca por rota pública.
export async function createAdminUser(input: CreateAdminInput): Promise<{ id: number; login: string }> {
  const login = normalizeLogin(input.login);
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!login) throw new Error("Informe o login do administrador.");
  if (!name) throw new Error("Informe o nome do administrador.");
  if (!isValidEmail(email)) throw new Error("E-mail inválido.");

  const passwordErrors = validatePasswordStrength(input.password, { email, name });
  if (passwordErrors.length > 0) throw new Error(passwordErrors.join(" "));

  const existing = await prisma.user.findFirst({
    where: { OR: [{ login }, { email }] },
    select: { id: true },
  });
  if (existing) throw new Error("Já existe um usuário com esse login ou e-mail.");

  const user = await prisma.user.create({
    data: {
      login,
      name,
      email,
      passwordHash: await hashPassword(input.password),
      role: "ADMIN",
      isTemporaryPassword: false,
    },
    select: { id: true, login: true },
  });

  return user;
}
