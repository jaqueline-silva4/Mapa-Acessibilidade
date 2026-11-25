import { Router, type Request } from "express";
import { pointsErrorHandler } from "../../lib/errors.js";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../../middlewares/auth.js";
import {
  createBlockSchema,
  createRoomSchema,
  idParamSchema,
  setPointPositionSchema,
  updateBlockSchema,
  updateRoomSchema,
} from "./campus-map.schemas.js";
import * as service from "./campus-map.service.js";

const institutionIdOf = (req: Request): number => Number(req.user!.sub);

export const institutionCampusMapRouter = Router();

institutionCampusMapRouter.use(
  authenticate,
  requirePasswordChanged,
  authorize("INSTITUTION")
);

institutionCampusMapRouter.get("/", async (req, res) => {
  res.json(await service.getInstitutionCampusMap(institutionIdOf(req)));
});

institutionCampusMapRouter.post("/blocks", async (req, res) => {
  const input = createBlockSchema.parse(req.body);
  res.status(201).json(await service.createBlock(institutionIdOf(req), input));
});

institutionCampusMapRouter.put("/blocks/:id", async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  const input = updateBlockSchema.parse(req.body);
  res.json(await service.updateBlock(id, institutionIdOf(req), input));
});

institutionCampusMapRouter.delete("/blocks/:id", async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  await service.deleteBlock(id, institutionIdOf(req));
  res.status(204).send();
});

institutionCampusMapRouter.post("/blocks/:id/rooms", async (req, res) => {
  const blockId = idParamSchema.parse(req.params.id);
  const input = createRoomSchema.parse(req.body);
  res
    .status(201)
    .json(await service.createRoom(blockId, institutionIdOf(req), input));
});

institutionCampusMapRouter.put("/rooms/:id", async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  const input = updateRoomSchema.parse(req.body);
  res.json(await service.updateRoom(id, institutionIdOf(req), input));
});

institutionCampusMapRouter.delete("/rooms/:id", async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  await service.deleteRoom(id, institutionIdOf(req));
  res.status(204).send();
});

institutionCampusMapRouter.put("/points/:id/position", async (req, res) => {
  const pointId = idParamSchema.parse(req.params.id);
  const input = setPointPositionSchema.parse(req.body);
  res.json(
    await service.setPointPosition(pointId, institutionIdOf(req), input)
  );
});

institutionCampusMapRouter.use(pointsErrorHandler);

export const publicCampusMapRouter = Router();

publicCampusMapRouter.get("/:id/campus-map", async (req, res) => {
  const institutionId = idParamSchema.parse(req.params.id);
  res.json(await service.getPublicCampusMap(institutionId));
});

publicCampusMapRouter.use(pointsErrorHandler);
