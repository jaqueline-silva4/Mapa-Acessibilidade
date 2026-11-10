import { Router } from "express";
import { pointsErrorHandler } from "../../lib/errors.js";
import {
  createReviewSchema,
  institutionIdSchema,
  listReviewsQuerySchema,
} from "./reviews.schemas.js";
import * as service from "./reviews.service.js";

export const reviewsRouter = Router();


reviewsRouter.post("/:id/reviews", async (req, res) => {
  const institutionId = institutionIdSchema.parse(req.params.id);
  const input = createReviewSchema.parse(req.body);

  const result = await service.createReview(institutionId, input);

  res.status(201).json(result);
});

reviewsRouter.get("/:id/reviews", async (req, res) => {
  const institutionId = institutionIdSchema.parse(req.params.id);
  const filters = listReviewsQuerySchema.parse(req.query);

  const result = await service.listPublicReviews(institutionId, filters);

  res.json(result);
});

reviewsRouter.use(pointsErrorHandler);