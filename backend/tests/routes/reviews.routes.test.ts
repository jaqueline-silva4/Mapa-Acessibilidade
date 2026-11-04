import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/modules/reviews/reviews.service.js", () => ({
  createReview: vi.fn(),
  listPublicReviews: vi.fn(),
}));

import { reviewsRouter } from "../../src/modules/reviews/reviews.routes.js";
import * as service from "../../src/modules/reviews/reviews.service.js";

const app = express();
app.use(express.json());
app.use("/api/institutions", reviewsRouter);

const URL = "/api/institutions/3/reviews";

const review = {
  authorName: "Maria Silva",
  authorEmail: "maria@email.com",
  rating: 5,
  comment: "Excelente acessibilidade!",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/institutions/:id/reviews", () => {
  it("201 ao cadastrar uma avaliação válida", async () => {
    vi.mocked(service.createReview).mockResolvedValue({
      review: { id: 1, ...review, institutionId: 3 },
      averageRating: 5,
      totalReviews: 1,
    } as Awaited<ReturnType<typeof service.createReview>>);

    const res = await request(app).post(URL).send(review);

    expect(res.status).toBe(201);
    expect(service.createReview).toHaveBeenCalledWith(3, review);
    expect(res.body.averageRating).toBe(5);
    expect(res.body.totalReviews).toBe(1);
  });

  it("400 quando o nome do autor está vazio", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...review, authorName: "" });

    expect(res.status).toBe(400);
    expect(service.createReview).not.toHaveBeenCalled();
  });

  it("400 quando a nota não é um número inteiro", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...review, rating: 4.5 });

    expect(res.status).toBe(400);
    expect(service.createReview).not.toHaveBeenCalled();
  });

  it("400 quando a avaliação possui nota menor que 1", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...review, rating: 0 });

    expect(res.status).toBe(400);
    expect(service.createReview).not.toHaveBeenCalled();
  });

  it("400 quando a avaliação possui nota maior que 5", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...review, rating: 6 });

    expect(res.status).toBe(400);
    expect(service.createReview).not.toHaveBeenCalled();
  });

  it("400 quando o e-mail é inválido", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...review, authorEmail: "email-invalido" });

    expect(res.status).toBe(400);
    expect(service.createReview).not.toHaveBeenCalled();
  });

  it("400 quando o comentário está vazio", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...review, comment: "" });

    expect(res.status).toBe(400);
    expect(service.createReview).not.toHaveBeenCalled();
  });

  it("400 quando o ID da instituição é inválido", async () => {
    const res = await request(app)
      .post("/api/institutions/abc/reviews")
      .send(review);

    expect(res.status).toBe(400);
    expect(service.createReview).not.toHaveBeenCalled();
  });
});

describe("GET /api/institutions/:id/reviews", () => {
  it("200 ao listar avaliações", async () => {
    vi.mocked(service.listPublicReviews).mockResolvedValue({
      data: [
        {
          id: 1,
          authorName: review.authorName,
          rating: review.rating,
          comment: review.comment,
          createdAt: "2026-11-02T10:00:00.000Z",
        },
      ],
      averageRating: 5,
      totalReviews: 1,
    } as Awaited<ReturnType<typeof service.listPublicReviews>>);

    const res = await request(app).get(URL);

    expect(res.status).toBe(200);
    expect(service.listPublicReviews).toHaveBeenCalledWith(3, {
      sort: "recent",
    });
    expect(res.body.data).toEqual([
      {
        id: 1,
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        createdAt: "2026-11-02T10:00:00.000Z",
      },
    ]);
    expect(res.body.totalReviews).toBe(1);
  });

  it("200 ao filtrar avaliações por nota", async () => {
    vi.mocked(service.listPublicReviews).mockResolvedValue({
      data: [],
      averageRating: 0,
      totalReviews: 0,
    } as Awaited<ReturnType<typeof service.listPublicReviews>>);

    const res = await request(app).get(`${URL}?rating=5`);

    expect(res.status).toBe(200);
    expect(service.listPublicReviews).toHaveBeenCalledWith(3, {
      sort: "recent",
      rating: 5,
    });
  });

  it("400 quando o filtro de nota não é um número inteiro", async () => {
    const res = await request(app).get(`${URL}?rating=4.5`);

    expect(res.status).toBe(400);
    expect(service.listPublicReviews).not.toHaveBeenCalled();
  });

  it.each(["recent", "oldest", "highest", "lowest"] as const)(
    "200 ao ordenar avaliações por %s",
    async (sort) => {
      vi.mocked(service.listPublicReviews).mockResolvedValue({
        data: [],
        averageRating: 0,
        totalReviews: 0,
      } as Awaited<ReturnType<typeof service.listPublicReviews>>);

      const res = await request(app).get(`${URL}?sort=${sort}`);

      expect(res.status).toBe(200);
      expect(service.listPublicReviews).toHaveBeenCalledWith(3, { sort });
    },
  );

  it("400 quando o filtro de nota é inválido", async () => {
    const res = await request(app).get(`${URL}?rating=8`);

    expect(res.status).toBe(400);
    expect(service.listPublicReviews).not.toHaveBeenCalled();
  });

  it("400 quando o tipo de ordenação é inválido", async () => {
    const res = await request(app).get(`${URL}?sort=invalid`);

    expect(res.status).toBe(400);
    expect(service.listPublicReviews).not.toHaveBeenCalled();
  });

  it("400 quando o ID da instituição é inválido", async () => {
    const res = await request(app).get(
      "/api/institutions/abc/reviews",
    );

    expect(res.status).toBe(400);
    expect(service.listPublicReviews).not.toHaveBeenCalled();
  });
});
