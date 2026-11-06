import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/modules/contact/contact.service.js", () => ({
  createContactMessage: vi.fn(),
}));

import { contactRouter } from "../../src/modules/contact/contact.routes.js";
import { createContactMessage } from "../../src/modules/contact/contact.service.js";

const app = express();
app.use(express.json());
app.use("/api/contact", contactRouter);

const URL = "/api/contact";

const contact = {
  reason: "QUESTION" as const,
  name: "Maria Silva",
  email: "maria@email.com",
  phone: "88999999999",
  message: "Gostaria de tirar uma dúvida.",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/contact", () => {
  it("201 ao enviar uma mensagem válida", async () => {
    vi.mocked(createContactMessage).mockResolvedValue({
      id: 1,
      ...contact,
      status: "PENDING",
      createdAt: new Date(),
    } as Awaited<ReturnType<typeof createContactMessage>>);

    const res = await request(app).post(URL).send(contact);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Mensagem enviada com sucesso.");
    expect(res.body.contact.status).toBe("PENDING");
    expect(createContactMessage).toHaveBeenCalledWith(contact);
  });

  it("201 quando o telefone não é informado", async () => {
    const { phone, ...contactWithoutPhone } = contact;

    vi.mocked(createContactMessage).mockResolvedValue({
      id: 2,
      ...contactWithoutPhone,
      phone: null,
      status: "PENDING",
      createdAt: new Date(),
    } as Awaited<ReturnType<typeof createContactMessage>>);

    const res = await request(app)
      .post(URL)
      .send(contactWithoutPhone);

    expect(res.status).toBe(201);
    expect(createContactMessage).toHaveBeenCalledWith(
      contactWithoutPhone,
    );
  });

  it("400 quando o e-mail é inválido", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...contact, email: "email-invalido" });

    expect(res.status).toBe(400);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("400 quando o motivo não é permitido", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...contact, reason: "OUTRO" });

    expect(res.status).toBe(400);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("400 quando a mensagem está vazia", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...contact, message: "" });

    expect(res.status).toBe(400);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("400 quando o nome não é informado", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...contact, name: "" });

    expect(res.status).toBe(400);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("400 quando o telefone ultrapassa 20 caracteres", async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...contact, phone: "123456789012345678901" });

    expect(res.status).toBe(400);
    expect(createContactMessage).not.toHaveBeenCalled();
  });
});