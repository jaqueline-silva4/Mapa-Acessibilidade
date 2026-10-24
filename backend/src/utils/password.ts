import bcrypt from "bcrypt";
import { randomInt } from "node:crypto";

const SALT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// RN04: mín. 8 caracteres, maiúscula, minúscula, número e símbolo; sem nome/e-mail.
// Devolve a lista de problemas; lista vazia = senha válida.
export function validatePasswordStrength(
  password: string,
  user: { email?: string; name?: string } = {},
): string[] {
  const errors: string[] = [];

  if (password.length < 8) errors.push("A senha deve ter pelo menos 8 caracteres.");
  if (!/[A-Z]/.test(password)) errors.push("A senha deve ter uma letra maiúscula.");
  if (!/[a-z]/.test(password)) errors.push("A senha deve ter uma letra minúscula.");
  if (!/\d/.test(password)) errors.push("A senha deve ter um número.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("A senha deve ter um símbolo.");

  const lower = password.toLowerCase();
  const forbidden: string[] = [];
  if (user.email) {
    forbidden.push(user.email.toLowerCase(), user.email.split("@")[0]!.toLowerCase());
  }
  if (user.name) {
    forbidden.push(...user.name.toLowerCase().split(/\s+/));
  }
  if (forbidden.some((part) => part.length >= 3 && lower.includes(part))) {
    errors.push("A senha não pode conter o seu nome ou e-mail.");
  }

  return errors;
}

// Senha provisória (RN02): 12 caracteres, com os 4 tipos, usando RNG criptográfico.
export function generateTemporaryPassword(): string {
  const sets = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%&*?",
  ];
  const all = sets.join("");

  const chars = sets.map((set) => set[randomInt(set.length)]!);
  while (chars.length < 12) chars.push(all[randomInt(all.length)]!);

  // embaralha (Fisher-Yates) para a ordem não ser previsível
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}