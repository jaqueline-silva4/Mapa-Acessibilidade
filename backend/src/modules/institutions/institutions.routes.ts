
import { Router } from "express";
import { sendError } from "../../routes/http-error.js";
import {
  institutionIdSchema,
  publicInstitutionsQuerySchema,
} from "./institutions.schemas.js";
import * as service from "./institutions.service.js";

export const publicInstitutionsRouter = Router();

// ---------- /api/institutions (pública) ----------

// Listar instituições ativas
publicInstitutionsRouter.get("/", async (req, res) => {
  const filters = publicInstitutionsQuerySchema.safeParse(req.query);

  if (!filters.success) {
    res.status(400).json({
      message: "Parâmetros de consulta inválidos.",
      errors: filters.error.issues,
    });
    return;
  }

  try {
    const institutions = await service.listPublicInstitutions(filters.data);
    res.json(institutions);
  } catch (error) {
    sendError(res, error);
  }
});

// Listar instituições para exibição no mapa
publicInstitutionsRouter.get("/map", async (_req, res) => {
  try {
    const institutions = await service.listPublicInstitutionsMap();
    res.json(institutions);
  } catch (error) {
    sendError(res, error);
  }
});

// Consultar detalhes de uma instituição
publicInstitutionsRouter.get("/:id", async (req, res) => {
  const id = institutionIdSchema.safeParse(req.params.id);

  if (!id.success) {
    res.status(400).json({
      message: "Identificador da instituição inválido.",
    });
    return;
  }

  try {
    const institution = await service.getPublicInstitutionById(id.data);
    res.json(institution);
  } catch (error) {
    sendError(res, error);
  }
});
