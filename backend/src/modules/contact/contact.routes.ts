import { Router } from "express";
import { pointsErrorHandler } from "../../lib/errors.js";
import { createContactSchema } from "./contact.schemas.js";
import { createContactMessage } from "./contact.service.js";

export const contactRouter = Router();

contactRouter.post("/", async (req, res) => {
  const input = createContactSchema.parse(req.body);

  const contact = await createContactMessage(input);

  res.status(201).json({
    message: "Mensagem enviada com sucesso.",
    contact,
  });
});

contactRouter.use(pointsErrorHandler);