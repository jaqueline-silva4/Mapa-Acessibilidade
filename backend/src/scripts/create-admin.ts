import { createInterface } from "node:readline/promises";
import { prisma } from "../db/prisma.js";
import { createAdminUser } from "../services/admin-user.service.js";

// Lê uma linha sem mostrar o que é digitado (para a senha não aparecer no terminal).
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") process.exit(1); // Ctrl+C
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  if (!process.stdin.isTTY) {
    throw new Error("Rode este script direto no terminal (ele pede a senha de forma interativa).");
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const login = await rl.question("Login do admin (ex: admin): ");
  const name = await rl.question("Nome: ");
  const email = await rl.question("E-mail: ");
  rl.close();

  const password = await askHidden("Senha: ");
  const confirmation = await askHidden("Confirme a senha: ");
  if (password !== confirmation) throw new Error("As senhas não conferem.");

  const admin = await createAdminUser({ login, name, email, password });
  console.log(`✅ Admin criado: id ${admin.id}, login "${admin.login}".`);
}

main()
  .catch((error) => {
    console.error(`❌ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
