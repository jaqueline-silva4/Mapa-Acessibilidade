import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    institution: {
      findFirst: vi.fn(),
    },
    accessibilityPoint: {
      findMany: vi.fn(),
    },
    accessibilityCategory: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/db/prisma.js", () => ({
  prisma: prismaMock,
}));

import { listPublicPoints } from "../../src/modules/points/points.service.js";

describe("listPublicPoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.accessibilityPoint.findMany.mockResolvedValue([]);
    prismaMock.accessibilityCategory.findMany.mockResolvedValue([]);
  });

  it("deve buscar a instituição pelo id dela, ativa e com conta ativa", async () => {
    prismaMock.institution.findFirst.mockResolvedValue({ userId: 42 });

    await listPublicPoints(5, []);

    expect(prismaMock.institution.findFirst).toHaveBeenCalledWith({
      where: {
        id: 5,
        active: true,
        user: { is: { role: "INSTITUTION", status: "ACTIVE" } },
      },
      select: { userId: true },
    });
  });

  it("deve consultar os pontos pelo userId da instituição, não pelo id dela", async () => {
    prismaMock.institution.findFirst.mockResolvedValue({ userId: 42 });

    await listPublicPoints(5, []);

    expect(prismaMock.accessibilityPoint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { institutionId: 42, active: true },
      })
    );
    expect(prismaMock.accessibilityCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { points: { some: { institutionId: 42, active: true } } },
      })
    );
  });

  it("deve aplicar o filtro por categorias do checklist", async () => {
    prismaMock.institution.findFirst.mockResolvedValue({ userId: 42 });

    await listPublicPoints(5, [1, 3]);

    expect(prismaMock.accessibilityPoint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          institutionId: 42,
          active: true,
          categoryId: { in: [1, 3] },
        },
      })
    );
  });

  it("deve marcar como em verificação o ponto com 3 ou mais denúncias", async () => {
    prismaMock.institution.findFirst.mockResolvedValue({ userId: 42 });
    prismaMock.accessibilityPoint.findMany.mockResolvedValue([
      { id: 1, title: "Rampa", reportCount: 3 },
      { id: 2, title: "Elevador", reportCount: 2 },
    ]);

    const result = await listPublicPoints(5, []);

    expect(result.data).toEqual([
      { id: 1, title: "Rampa", underReview: true },
      { id: 2, title: "Elevador", underReview: false },
    ]);
  });

  it("deve responder 404 para instituição inexistente, inativa ou suspensa", async () => {
    prismaMock.institution.findFirst.mockResolvedValue(null);

    await expect(listPublicPoints(99, [])).rejects.toMatchObject({
      status: 404,
    });
    expect(prismaMock.accessibilityPoint.findMany).not.toHaveBeenCalled();
  });
});
