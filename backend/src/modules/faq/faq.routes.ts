import { Router } from "express";
import { pointsErrorHandler } from "../../lib/errors.js";
import { listFAQItems } from "./faq.service.js";

export const faqRouter = Router();

faqRouter.get("/", async (_req, res) => {
  const items = await listFAQItems();

  res.json(items);
});

faqRouter.use(pointsErrorHandler);