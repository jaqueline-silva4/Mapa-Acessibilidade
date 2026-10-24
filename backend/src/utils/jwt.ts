import jwt, { type SignOptions } from "jsonwebtoken";

export type Role = "ADMIN" | "INSTITUTION";

export interface AuthTokenPayload {
  sub: string; // id do usuário
  role: Role;
  isTemporaryPassword: boolean;
}

// O segredo é lido dentro das funções, e não no topo do arquivo, porque
// os imports rodam antes do dotenv.config() do server.ts.
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não definido no .env");
  return secret;
}

export function signToken(payload: AuthTokenPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as unknown as AuthTokenPayload;
}