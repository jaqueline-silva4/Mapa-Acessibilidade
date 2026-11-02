
import { Router } from "express";
import { z } from "zod";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../middlewares/auth.js";
import { generateInstitutionCredentials } from "../services/institution-credentials.service.js";
import { sendError } from "./http-error.js";

import {
  createInstitutionSchema,
  updateInstitutionSchema,
  institutionIdSchema,
  listInstitutionsQuerySchema,
} from "../modules/institutions/institutions.schemas.js";

import * as institutionService from "../modules/institutions/institutions.service.js";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
  cnpj: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().min(1),
});

const statusSchema = z.object({
  active: z.boolean(),
});

export const adminRouter = Router();

// Tudo em /api/admin exige: token válido, senha já trocada e perfil ADMIN (RNF03).
adminRouter.use(authenticate, requirePasswordChanged, authorize("ADMIN"));

// ---------- Rota antiga: geração de credenciais ----------

// Mantida para preservar o funcionamento que já existia.
adminRouter.post("/institutions/:id/credentials", async (req, res) => {
  const params = paramsSchema.safeParse(req.params);
  const body = bodySchema.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({
      message: "Informe o id da instituição, o CNPJ, o nome e o e-mail.",
    });
    return;
  }

  try {
    const credentials = await generateInstitutionCredentials(body.data);

    res.status(credentials.created ? 201 : 200).json({
      institutionId: params.data.id,
      login: credentials.login,
      temporaryPassword: credentials.temporaryPassword,
      message: "Entregue estas credenciais ao responsável. A senha provisória não poderá ser consultada depois.",
    });
  } catch (error) {
    sendError(res, error);
  }
});

// ---------- Novas rotas: gestão de instituições ----------

// Cadastrar instituição
adminRouter.post("/institutions", async (req, res) => {
  const input = createInstitutionSchema.safeParse(req.body);

  if (!input.success) {
    res.status(400).json({
      message: "Dados da instituição inválidos.",
      errors: input.error.issues,
    });
    return;
  }

  try {
    const result = await institutionService.createInstitution(input.data);

    res.status(201).json({
      institution: result.institution,
      credentials: result.credentials,
      message: "Instituição cadastrada. Entregue as credenciais ao responsável.",
    });
  } catch (error) {
    sendError(res, error);
  }
});

// Listar instituições
adminRouter.get("/institutions", async (req, res) => {
  const filters = listInstitutionsQuerySchema.safeParse(req.query);

  if (!filters.success) {
    res.status(400).json({
      message: "Parâmetros de consulta inválidos.",
      errors: filters.error.issues,
    });
    return;
  }

  try {
    const institutions = await institutionService.listInstitutions(filters.data);
    res.json(institutions);
  } catch (error) {
    sendError(res, error);
  }
});

// Atualizar instituição
adminRouter.put("/institutions/:id", async (req, res) => {
  const id = institutionIdSchema.safeParse(req.params.id);
  const input = updateInstitutionSchema.safeParse(req.body);

  if (!id.success || !input.success) {
    res.status(400).json({
      message: "Informe um id válido e dados válidos para a instituição.",
    });
    return;
  }

  try {
    const institution = await institutionService.updateInstitution(
      id.data,
      input.data,
    );

    res.json(institution);
  } catch (error) {
    sendError(res, error);
  }
});

// Ativar ou inativar instituição
adminRouter.patch("/institutions/:id/status", async (req, res) => {
  const id = institutionIdSchema.safeParse(req.params.id);
  const body = statusSchema.safeParse(req.body);

  if (!id.success || !body.success) {
    res.status(400).json({
      message: "Informe um id válido e o status da instituição.",
    });
    return;
  }

  try {
    const institution = await institutionService.updateInstitutionStatus(
      id.data,
      body.data.active,
    );

    res.json(institution);
  } catch (error) {
    sendError(res, error);
  }
});
