import { Router, type Request } from "express";
import { pointsErrorHandler } from "../../lib/errors.js";
import { uploadPointImages } from "../../lib/upload.js";
import { authenticate, authorize, requirePasswordChanged } from "../../middlewares/auth.js";
import {
  createPointSchema,
  idParamSchema,
  parseCategoriesQuery,
  updatePointSchema,
} from "./points.schemas.js";
import * as service from "./points.service.js";

const uploadedFiles = (req: Request): Express.Multer.File[] =>
  (req.files as Express.Multer.File[] | undefined) ?? [];

// RN09: o id da instituição vem sempre do token (sub), nunca do corpo da requisição.
const institutionIdOf = (req: Request): number => Number(req.user!.sub);

// ---------- /api/institution/points (protegida) ----------
export const institutionPointsRouter = Router();

// Mesmo padrão do /api/admin: token válido, senha já trocada e perfil correto.
// A autenticação vem antes do upload, para não gravar arquivo de quem não está logado.
institutionPointsRouter.use(authenticate, requirePasswordChanged, authorize("INSTITUTION"));

institutionPointsRouter.post("/", uploadPointImages, async (req, res) => {
  const files = uploadedFiles(req);
  try {
    const input = createPointSchema.parse(req.body);
    const point = await service.createPoint(institutionIdOf(req), input, files);
    res.status(201).json(point);
  } catch (error) {
    await service.discardFiles(files); // não deixa foto órfã no disco
    throw error;
  }
});

institutionPointsRouter.put("/:id", uploadPointImages, async (req, res) => {
  const files = uploadedFiles(req);
  try {
    const id = idParamSchema.parse(req.params.id);
    const input = updatePointSchema.parse(req.body);
    res.json(await service.updatePoint(id, institutionIdOf(req), input, files));
  } catch (error) {
    await service.discardFiles(files);
    throw error;
  }
});

institutionPointsRouter.delete("/:id", async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  await service.deletePoint(id, institutionIdOf(req));
  res.status(204).send();
});

institutionPointsRouter.use(pointsErrorHandler);

// ---------- /api/institutions/:id/points (pública) ----------
export const publicPointsRouter = Router();

publicPointsRouter.get("/:id/points", async (req, res) => {
  const institutionId = idParamSchema.parse(req.params.id);
  const categoryIds = parseCategoriesQuery(req.query.categories); // ?categories=1,2,5
  res.json(await service.listPublicPoints(institutionId, categoryIds));
});

publicPointsRouter.use(pointsErrorHandler);

//  /api/accessibility-categories (pública, alimenta o checklist) ----
export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  res.json(await service.listCategories());
});

categoriesRouter.use(pointsErrorHandler);