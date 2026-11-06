import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    contactMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/db/prisma.js", () => ({
  prisma: prismaMock,
}));

import {
  createContactMessage,
  listContactMessages,
} from "../../src/modules/contact/contact.service.js";

describe("Contact service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createContactMessage", () => {
    it("deve cadastrar uma mensagem com status PENDING", async () => {
      const input = {
        reason: "QUESTION" as const,
        name: "Maria",
        email: "maria@email.com",
        phone: "88999999999",
        message: "Tenho uma dúvida sobre a plataforma.",
      };

      prismaMock.contactMessage.create.mockResolvedValue({
        id: 1,
        ...input,
        status: "PENDING",
        createdAt: new Date(),
      });

      const result = await createContactMessage(input);

      expect(prismaMock.contactMessage.create).toHaveBeenCalledWith({
        data: {
          ...input,
          status: "PENDING",
        },
      });

      expect(result.status).toBe("PENDING");
    });
  });

  describe("listContactMessages", () => {
    it("deve listar as mensagens da mais recente para a mais antiga", async () => {
      prismaMock.contactMessage.findMany.mockResolvedValue([
        { id: 2, name: "João" },
        { id: 1, name: "Maria" },
      ]);

      const result = await listContactMessages();

      expect(prismaMock.contactMessage.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2);
    });
  });
});