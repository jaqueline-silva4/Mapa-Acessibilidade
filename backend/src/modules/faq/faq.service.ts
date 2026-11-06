import { prisma } from "../../db/prisma.js";

export async function listFAQItems() {
  return prisma.fAQItem.findMany({
    orderBy: [
      { category: "asc" },
      { question: "asc" },
    ],
  });
}