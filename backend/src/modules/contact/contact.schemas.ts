import { z } from "zod";

export const createContactSchema = z.object({
  reason: z.enum(["QUESTION", "REGISTRATION_REQUEST"]),
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1, "Escreva uma mensagem.").max(2000),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;