import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    institution: {
      findFirst: vi.fn(),
    },
    review: {
      create: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../src/db/prisma.js", () => ({
  prisma: prismaMock,
}));

import {
  createReview,
  listPublicReviews,
  moderateReview,
} from "../../src/modules/reviews/reviews.service.js";

describe("Reviews service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReview", () => {
    it("deve criar uma avaliação e retornar a média atualizada", async () => {
      prismaMock.institution.findFirst.mockResolvedValue({ id: 1 });

      prismaMock.review.create.mockResolvedValue({
        id: 10,
        institutionId: 1,
        authorName: "Maria",
        rating: 5,
        comment: "Excelente acessibilidade.",
        createdAt: new Date(),
      });

      prismaMock.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { _all: 1 },
      });

      const result = await createReview(1, {
        authorName: "Maria",
        authorEmail: "maria@email.com",
        rating: 5,
        comment: "Excelente acessibilidade.",
      });

      expect(prismaMock.review.create).toHaveBeenCalled();
      expect(prismaMock.institution.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          active: true,
          user: { is: { status: "ACTIVE" } },
        },
        select: { id: true },
      });
      expect(result.averageRating).toBe(5);
      expect(result.totalReviews).toBe(1);
    });

    it("não deve criar avaliação quando a instituição não existe ou está indisponível", async () => {
      prismaMock.institution.findFirst.mockResolvedValue(null);

      await expect(
        createReview(999, {
          authorName: "Maria",
          authorEmail: "maria@email.com",
          rating: 5,
          comment: "Excelente acessibilidade.",
        }),
      ).rejects.toThrow("Instituição não encontrada ou indisponível.");

      expect(prismaMock.institution.findFirst).toHaveBeenCalledWith({
        where: {
          id: 999,
          active: true,
          user: { is: { status: "ACTIVE" } },
        },
        select: { id: true },
      });

      expect(prismaMock.review.create).not.toHaveBeenCalled();
      expect(prismaMock.review.aggregate).not.toHaveBeenCalled();
    });
  });

  describe("listPublicReviews", () => {
    it("deve listar avaliações ativas sem expor o e-mail e retornar a média geral", async () => {
      prismaMock.institution.findFirst.mockResolvedValue({ id: 1 });

      prismaMock.review.findMany.mockResolvedValue([
        {
          id: 10,
          authorName: "Maria",
          rating: 5,
          comment: "Excelente.",
          createdAt: new Date(),
        },
      ]);

      prismaMock.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { _all: 2 },
      });

      const result = await listPublicReviews(1, {
        sort: "recent",
      });

      expect(prismaMock.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            institutionId: 1,
            active: true,
          },
          select: {
            id: true,
            authorName: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
          ],
        }),
      );

      expect(prismaMock.review.aggregate).toHaveBeenCalledWith({
        where: {
          institutionId: 1,
          active: true,
        },
        _avg: { rating: true },
        _count: { _all: true },
      });

      expect(result.data).toHaveLength(1);
      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviews).toBe(2);
      expect(result.data[0]).not.toHaveProperty("authorEmail");
    });

    it("deve filtrar avaliações pela nota informada", async () => {
      prismaMock.institution.findFirst.mockResolvedValue({ id: 1 });
      prismaMock.review.findMany.mockResolvedValue([]);
      prismaMock.review.aggregate.mockResolvedValue({
        _avg: { rating: 0 },
        _count: { _all: 0 },
      });

      await listPublicReviews(1, {
        sort: "recent",
        rating: 5,
      });

      expect(prismaMock.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            institutionId: 1,
            active: true,
            rating: 5,
          },
        }),
      );
    });

    it.each([
      ["recent", [{ createdAt: "desc" }, { id: "desc" }]],
      ["oldest", [{ createdAt: "asc" }, { id: "asc" }]],
      ["highest", [{ rating: "desc" }, { createdAt: "desc" }]],
      ["lowest", [{ rating: "asc" }, { createdAt: "asc" }]],
    ] as const)("deve aplicar a ordenação %s", async (sort, orderBy) => {
      prismaMock.institution.findFirst.mockResolvedValue({ id: 1 });
      prismaMock.review.findMany.mockResolvedValue([]);
      prismaMock.review.aggregate.mockResolvedValue({
        _avg: { rating: 0 },
        _count: { _all: 0 },
      });

      await listPublicReviews(1, { sort });

      expect(prismaMock.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy }),
      );
    });
  });

  describe("moderateReview", () => {
    it("deve desativar a avaliação, registrar auditoria e recalcular a média", async () => {
      const transactionMock = {
        review: {
          findUnique: vi.fn().mockResolvedValue({
            id: 10,
            active: true,
            institutionId: 1,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({}),
        },
      };

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(transactionMock),
      );

      prismaMock.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { _all: 2 },
      });

      const result = await moderateReview(10, 99);

      expect(transactionMock.review.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { active: false },
      });

      expect(transactionMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: 99,
          action: "REVIEW_DEACTIVATED",
          targetEntity: "Review",
          targetId: 10,
          details: "Avaliação desativada por moderação administrativa.",
        },
      });

      expect(result.averageRating).toBe(4);
      expect(result.totalReviews).toBe(2);
    });

    it("não deve moderar uma avaliação inexistente ou já desativada", async () => {
      const transactionMock = {
        review: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
        auditLog: {
          create: vi.fn(),
        },
      };

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(transactionMock),
      );

      await expect(moderateReview(999, 99)).rejects.toThrow(
        "Avaliação não encontrada ou já removida.",
      );

      expect(transactionMock.review.update).not.toHaveBeenCalled();
      expect(transactionMock.auditLog.create).not.toHaveBeenCalled();
    });

    it("não deve aceitar um identificador de administrador inválido", async () => {
      await expect(moderateReview(10, 0)).rejects.toThrow(
        "Identificação do administrador inválida.",
      );

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });
});