import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize, requirePasswordChanged } from "../middlewares/auth.js";
import { generateInstitutionCredentials } from "../services/institution-credentials.service.js";
import { sendError } from "./http-error.js";

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });
const bodySchema = z.object({
  cnpj: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().min(1),
});

export const adminRouter = Router();

// Tudo em /api/admin exige: token válido, senha já trocada e perfil ADMIN (RNF03).
adminRouter.use(authenticate, requirePasswordChanged, authorize("ADMIN"));

// TODO(issue #13): quando existir o model Institution, buscar a instituição por :id
// e ler CNPJ, nome e e-mail dela, em vez de receber esses dados no corpo.
adminRouter.post("/institutions/:id/credentials", async (req, res) => {
  const params = paramsSchema.safeParse(req.params);
  const body = bodySchema.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ message: "Informe o id da instituição, o CNPJ, o nome e o e-mail." });
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
