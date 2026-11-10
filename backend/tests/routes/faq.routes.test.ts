import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/modules/faq/faq.service.js", () => ({
  listFAQItems: vi.fn(),
}));

import { faqRouter } from "../../src/modules/faq/faq.routes.js";
import { listFAQItems } from "../../src/modules/faq/faq.service.js";

const app = express();
app.use(express.json());
app.use("/api/faq", faqRouter);

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/faq", () => {
  it("200 ao listar perguntas frequentes", async () => {
    const items = [
      {
        id: 1,
        category: "MAP",
        question: "Como encontrar instituições?",
        answer: "Utilize a página do mapa.",
      },
      {
        id: 2,
        category: "LIBRAS",
        question: "O que é Libras?",
        answer: "É a Língua Brasileira de Sinais.",
      },
    ];

    vi.mocked(listFAQItems).mockResolvedValue(
      items as Awaited<ReturnType<typeof listFAQItems>>,
    );

    const res = await request(app).get("/api/faq");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(items);
    expect(listFAQItems).toHaveBeenCalledOnce();
  });

  it("200 quando não existem perguntas frequentes cadastradas", async () => {
    vi.mocked(listFAQItems).mockResolvedValue([]);

    const res = await request(app).get("/api/faq");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});