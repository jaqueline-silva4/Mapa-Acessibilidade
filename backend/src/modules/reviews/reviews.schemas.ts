import { z } from "zod";

export const createReviewSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),

  authorEmail: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(255, "O e-mail deve ter no máximo 255 caracteres."),

  rating: z.coerce
    .number()
    .int("A avaliação deve ser um número inteiro.")
    .min(1, "A avaliação mínima é 1.")
    .max(5, "A avaliação máxima é 5."),

  comment: z
    .string()
    .trim()
    .min(1, "O comentário é obrigatório.")
    .max(2000, "O comentário deve ter no máximo 2000 caracteres."),
});

export const institutionIdSchema = z.coerce.number().int().positive();

export const listReviewsQuerySchema = z.object({
  sort: z
    .enum(["recent", "oldest", "highest", "lowest"])
    .default("recent"),

  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;