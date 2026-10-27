import { z } from "zod";

// Em multipart tudo chega como texto: listas vêm como JSON, ex.: altTexts='["Rampa na entrada"]'.
function parseJson(value: unknown): unknown {
  if (value === undefined || value === "") return [];
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value; // o z.array rejeita e o usuário recebe a mensagem de erro
  }
}

const jsonArray = <T extends z.ZodType>(item: T) => z.preprocess(parseJson, z.array(item));

const optionalBoolean = z.preprocess(
  (value) => (value === undefined ? undefined : value === true || value === "true"),
  z.boolean().optional(),
);

const altText = z
  .string()
  .trim()
  .min(1, "O texto alternativo da imagem é obrigatório.")
  .max(250, "O texto alternativo deve ter no máximo 250 caracteres.");

const title = z.string().trim().min(3, "Informe um título.").max(120);

const description = z
  .string()
  .trim()
  .min(20, "Descreva o recurso (localização, largura, inclinação etc.) com pelo menos 20 caracteres.")
  .max(2000);

export const createPointSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  title,
  description,
  active: optionalBoolean,
  altTexts: jsonArray(altText), // um por arquivo enviado, na mesma ordem
});

export const updatePointSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  title: title.optional(),
  description: description.optional(),
  active: optionalBoolean,
  altTexts: jsonArray(altText), // um por arquivo NOVO enviado, na mesma ordem
  removeImageIds: jsonArray(z.number().int().positive()),
  imageAlts: jsonArray(z.object({ id: z.number().int().positive(), altText })), // edita o alt de fotos já existentes
});

export const idParamSchema = z.coerce.number().int().positive();

export type CreatePointInput = z.infer<typeof createPointSchema>;
export type UpdatePointInput = z.infer<typeof updatePointSchema>;

// "1,2,5" -> [1, 2, 5]
export function parseCategoriesQuery(raw: unknown): number[] {
  if (raw === undefined || raw === "") return [];
  const text = Array.isArray(raw) ? raw.join(",") : String(raw);
  return z
    .array(z.coerce.number().int().positive())
    .parse(text.split(",").map((part) => part.trim()).filter(Boolean));
}