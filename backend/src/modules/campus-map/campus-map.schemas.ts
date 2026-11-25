import { z } from "zod";

const percentCoord = z.coerce.number().finite().min(0).max(100);
const percentSize = z.coerce.number().finite().min(4).max(100);

export const idParamSchema = z.coerce.number().int().positive();

export const createBlockSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do bloco.").max(100),
  subtitle: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(120).nullable().optional(),
  ),
  x: percentCoord,
  y: percentCoord,
  width: percentSize.default(24),
  height: percentSize.default(22),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.")
    .optional()
    .default("#0b78c2"),
});

export const updateBlockSchema = createBlockSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Informe ao menos um campo.");

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da sala.").max(100),
  roomType: z
    .enum(["room", "hall", "restroom", "reception", "lab", "stairs"])
    .optional()
    .default("room"),
  x: percentCoord,
  y: percentCoord,
  width: percentSize.default(24),
  height: percentSize.default(22),
});

export const updateRoomSchema = createRoomSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Informe ao menos um campo.");

export const setPointPositionSchema = z.object({
  mapBlockId: z.number().int().positive().nullable(),
  mapX: percentCoord.nullable(),
  mapY: percentCoord.nullable(),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type SetPointPositionInput = z.infer<typeof setPointPositionSchema>;
