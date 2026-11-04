import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    fAQItem: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/db/prisma.js", () => ({
  prisma: prismaMock,
}));

import { listFAQItems } from "../../src/modules/faq/faq.service.js";

describe("FAQ service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar as perguntas frequentes ordenadas por categoria e pergunta", async () => {
    prismaMock.fAQItem.findMany.mockResolvedValue([
      {
        id: 1,
        category: "GENERAL",
        question: "Como funciona a plataforma?",
        answer: "A plataforma apresenta informações sobre acessibilidade.",
      },
    ]);

    const result = await listFAQItems();

    expect(prismaMock.fAQItem.findMany).toHaveBeenCalledWith({
      orderBy: [
        { category: "asc" },
        { question: "asc" },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("GENERAL");
  });

  it("deve retornar uma lista vazia quando não houver perguntas cadastradas", async () => {
    prismaMock.fAQItem.findMany.mockResolvedValue([]);

    const result = await listFAQItems();

    expect(result).toEqual([]);
  });
});