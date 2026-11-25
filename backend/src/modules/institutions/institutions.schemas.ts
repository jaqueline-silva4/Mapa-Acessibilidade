
import { z } from "zod";
import { isValidCnpj, normalizeCnpj } from "../../utils/cnpj.js";
import { isValidEmail } from "../../utils/email.js";

// Validação e normalização do CNPJ.
const cnpjSchema = z
  .string()
  .trim()
  .transform(normalizeCnpj)
  .refine(isValidCnpj, "CNPJ inválido.");

// Validação e normalização do e-mail.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidEmail, "E-mail inválido.");

// Validação do CEP: mantém somente os números.
const zipCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 8, "CEP inválido.");

const DOMAIN_REGEX =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

// Normaliza e valida domínio personalizado (ex.: acessibilidade.ifce.edu.br).
const customDomainSchema = z
  .string()
  .trim()
  .transform((value) =>
    value
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split(":")[0]
      .replace(/\.+$/, "")
  )
  .refine(
    (value) => value === "" || (value.length <= 253 && DOMAIN_REGEX.test(value)),
    "Domínio personalizado inválido. Ex.: acessibilidade.ifce.edu.br"
  )
  .transform((value) => (value === "" ? null : value));

// Campos utilizados no cadastro.
export const createInstitutionSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome completo da instituição."),
  unitName: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(160, "Nome da unidade muito longo.").nullable().optional(),
  ),
  cnpj: cnpjSchema,
  phone: z.string().trim().min(8, "Telefone inválido.").max(20),
  email: emailSchema,
  description: z.string().trim().max(2000).optional().default(""),
  street: z.string().trim().min(1, "Informe a rua.").nullable().optional(),
  number: z.string().trim().min(1, "Informe o número.").nullable().optional(),
  neighborhood: z.string().trim().min(1, "Informe o bairro.").nullable().optional(),
  city: z.string().trim().min(1, "Informe a cidade.").nullable().optional(),
  state: z.string().trim().length(2, "Informe a UF com duas letras.").toUpperCase().nullable().optional(),
  zipCode: zipCodeSchema.nullable().optional(),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
  logoUrl: z.string().trim().min(1).max(500).nullable().optional(),
  coverUrl: z.string().trim().min(1).max(500).nullable().optional(),
  floorPlanUrl: z.string().trim().min(1).max(500).nullable().optional(),
  floorPlanAlt: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(250).nullable().optional(),
  ),
  customDomain: customDomainSchema.nullable().optional(),
});

// Na edição, todos os campos podem ser enviados parcialmente.
export const updateInstitutionSchema = createInstitutionSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos um campo para atualizar.",
  );

// Identificador recebido pelos parâmetros das rotas.
export const institutionIdSchema = z.coerce.number().int().positive();

// Filtros da listagem administrativa.
export const listInstitutionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  active: z.enum(["true", "false", "all"]).default("all"),
  search: z.string().trim().optional(),
});

// Filtros da consulta pública.
export const publicInstitutionsQuerySchema = z.object({
  search: z.string().trim().optional(),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;

export type ListInstitutionsQuery = z.infer<
  typeof listInstitutionsQuerySchema
>;

export type PublicInstitutionsQuery = z.infer<
  typeof publicInstitutionsQuerySchema
>;
