import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    institution: {
      findMany: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("../../src/db/prisma.js", () => ({
  prisma: prismaMock,
}));

import { listPublicInstitutionsMap } from "../../src/modules/institutions/institutions.service.js";

const baseInstitution = {
  description: "Descrição",
  street: "Rua A",
  number: "10",
  neighborhood: "Centro",
  city: "Iguatu",
  state: "CE",
  latitude: -6.36,
  longitude: -39.3,
};

describe("listPublicInstitutionsMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar lista vazia sem consultar avaliações", async () => {
    prismaMock.institution.findMany.mockResolvedValue([]);

    const result = await listPublicInstitutionsMap();

    expect(result).toEqual([]);
    expect(prismaMock.review.groupBy).not.toHaveBeenCalled();
  });

  it("deve incluir endereço, média e total de avaliações", async () => {
    prismaMock.institution.findMany.mockResolvedValue([
      { id: 1, name: "IFCE", ...baseInstitution },
      { id: 2, name: "Biblioteca", ...baseInstitution },
    ]);
    prismaMock.review.groupBy.mockResolvedValue([
      { institutionId: 1, _avg: { rating: 4.26 }, _count: { _all: 3 } },
    ]);

    const result = await listPublicInstitutionsMap();

    expect(result[0]).toMatchObject({
      id: 1,
      street: "Rua A",
      averageRating: 4.3,
      reviewsCount: 3,
    });
    // Instituição sem avaliações recebe média e total zerados.
    expect(result[1]).toMatchObject({
      id: 2,
      averageRating: 0,
      reviewsCount: 0,
    });
  });

  it("deve considerar apenas avaliações ativas das instituições listadas", async () => {
    prismaMock.institution.findMany.mockResolvedValue([
      { id: 7, name: "Museu", ...baseInstitution },
    ]);
    prismaMock.review.groupBy.mockResolvedValue([]);

    await listPublicInstitutionsMap();

    expect(prismaMock.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, institutionId: { in: [7] } },
      })
    );
  });
});
