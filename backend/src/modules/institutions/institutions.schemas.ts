
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

// Campos utilizados no cadastro.
export const createInstitutionSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da instituição."),
  cnpj: cnpjSchema,
  phone: z.string().trim().min(8, "Telefone inválido.").max(20),
  email: emailSchema,
  description: z.string().trim().max(2000),
  street: z.string().trim().min(1, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  neighborhood: z.string().trim().min(1, "Informe o bairro."),
  city: z.string().trim().min(1, "Informe a cidade."),
  state: z.string().trim().length(2, "Informe a UF com duas letras.").toUpperCase(),
  zipCode: zipCodeSchema,
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
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
