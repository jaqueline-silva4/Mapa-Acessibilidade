import { prisma } from "../src/db/prisma.js";

// RN08: categorias fixas e padronizadas da plataforma.
// Pode rodar várias vezes: atualiza o que já existe em vez de duplicar.
const categories = [
  { name: "Rampa", icon: "ramp" },
  { name: "Piso Tátil", icon: "tactile-paving" },
  { name: "Banheiro Adaptado", icon: "accessible-restroom" },
  { name: "Intérprete de Libras", icon: "sign-language" },
  { name: "Elevador", icon: "elevator" },
  { name: "Audiodescrição", icon: "audio-description" },
  { name: "Vaga Reservada", icon: "parking" },
  { name: "Sinalização em Braille", icon: "braille" },
];

async function main(): Promise<void> {
  for (const category of categories) {
    await prisma.accessibilityCategory.upsert({
      where: { name: category.name },
      update: { icon: category.icon },
      create: category,
    });
  }
  console.log(`Seed concluído: ${categories.length} categorias de acessibilidade.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());