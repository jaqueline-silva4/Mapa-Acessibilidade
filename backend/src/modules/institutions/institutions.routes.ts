
import { Router } from "express";
import multer from "multer";
import {
  INSTITUTION_LOGO_URL_PREFIX,
  uploadInstitutionCover,
  uploadInstitutionFloorPlan,
  uploadInstitutionLogo,
} from "../../lib/upload.js";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../../middlewares/auth.js";
import { sendError } from "../../routes/http-error.js";
import {
  institutionIdSchema,
  publicInstitutionsQuerySchema,
  updateInstitutionSchema,
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

// Resolver instituição por domínio personalizado (ex.: acessibilidade.ifce.edu.br)
publicInstitutionsRouter.get("/by-domain/:domain", async (req, res) => {
  try {
    const institution = await service.getPublicInstitutionByDomain(
      req.params.domain
    );
    res.json(institution);
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

// ---------- /api/institution/profile (instituição autenticada) ----------

export const institutionProfileRouter = Router();

institutionProfileRouter.use(
  authenticate,
  requirePasswordChanged,
  authorize("INSTITUTION")
);

institutionProfileRouter.get("/", async (req, res) => {
  try {
    const institution = await service.getInstitutionProfileByUserId(
      Number(req.user!.sub)
    );
    res.json(institution);
  } catch (error) {
    sendError(res, error);
  }
});

institutionProfileRouter.put("/", async (req, res) => {
  const input = updateInstitutionSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({
      message: "Dados da instituição inválidos.",
      errors: input.error.issues,
    });
    return;
  }

  try {
    const institution = await service.updateInstitutionProfileByUserId(
      Number(req.user!.sub),
      input.data
    );
    res.json(institution);
  } catch (error) {
    sendError(res, error);
  }
});

institutionProfileRouter.post("/logo", (req, res) => {
  uploadInstitutionLogo(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "A logo deve ter no máximo 5 MB."
          : "Erro ao processar o arquivo da logo.";
      res.status(400).json({ message });
      return;
    }

    if (err) {
      sendError(res, err);
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Envie uma imagem para a logo." });
      return;
    }

    res.status(201).json({
      logoUrl: `${INSTITUTION_LOGO_URL_PREFIX}/${req.file.filename}`,
    });
  });
});

institutionProfileRouter.post("/cover", (req, res) => {
  uploadInstitutionCover(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "A capa deve ter no máximo 5 MB."
          : "Erro ao processar o arquivo da capa.";
      res.status(400).json({ message });
      return;
    }

    if (err) {
      sendError(res, err);
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Envie uma imagem para a capa." });
      return;
    }

    res.status(201).json({
      coverUrl: `${INSTITUTION_LOGO_URL_PREFIX}/${req.file.filename}`,
    });
  });
});

institutionProfileRouter.post("/floor-plan", (req, res) => {
  uploadInstitutionFloorPlan(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "A planta da instituição deve ter no máximo 5 MB."
          : "Erro ao processar o arquivo da planta.";
      res.status(400).json({ message });
      return;
    }

    if (err) {
      sendError(res, err);
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Envie uma imagem para a planta." });
      return;
    }

    res.status(201).json({
      floorPlanUrl: `${INSTITUTION_LOGO_URL_PREFIX}/${req.file.filename}`,
    });
  });
});
