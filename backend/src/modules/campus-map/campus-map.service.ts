import { prisma } from "../../db/prisma.js";
import { AppError } from "../../lib/errors.js";
import { REPORT_THRESHOLD } from "../points/points.service.js";
import type {
  CreateBlockInput,
  CreateRoomInput,
  SetPointPositionInput,
  UpdateBlockInput,
  UpdateRoomInput,
} from "./campus-map.schemas.js";

const pointInclude = {
  category: true,
  images: { select: { id: true, imageUrl: true, altText: true } },
} as const;

async function findOwnedBlock(id: number, institutionId: number) {
  const block = await prisma.campusBlock.findFirst({
    where: { id, institutionId },
  });
  if (!block) throw new AppError(404, "Bloco não encontrado.");
  return block;
}

async function findOwnedRoom(id: number, institutionId: number) {
  const room = await prisma.campusRoom.findFirst({
    where: { id, block: { institutionId } },
  });
  if (!room) throw new AppError(404, "Sala não encontrada.");
  return room;
}

export async function getInstitutionCampusMap(institutionId: number) {
  const [blocks, points] = await Promise.all([
    prisma.campusBlock.findMany({
      where: { institutionId },
      include: { rooms: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }),
    prisma.accessibilityPoint.findMany({
      where: { institutionId },
      include: pointInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  ]);

  return { blocks, points };
}

export async function createBlock(
  institutionId: number,
  input: CreateBlockInput
) {
  return prisma.campusBlock.create({
    data: {
      institutionId,
      name: input.name,
      subtitle: input.subtitle ?? null,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      color: input.color,
    },
    include: { rooms: true },
  });
}

export async function updateBlock(
  id: number,
  institutionId: number,
  input: UpdateBlockInput
) {
  await findOwnedBlock(id, institutionId);
  return prisma.campusBlock.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.x !== undefined ? { x: input.x } : {}),
      ...(input.y !== undefined ? { y: input.y } : {}),
      ...(input.width !== undefined ? { width: input.width } : {}),
      ...(input.height !== undefined ? { height: input.height } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    },
    include: { rooms: { orderBy: { id: "asc" } } },
  });
}

export async function deleteBlock(id: number, institutionId: number) {
  await findOwnedBlock(id, institutionId);
  await prisma.campusBlock.delete({ where: { id } });
}

export async function createRoom(
  blockId: number,
  institutionId: number,
  input: CreateRoomInput
) {
  await findOwnedBlock(blockId, institutionId);
  return prisma.campusRoom.create({
    data: {
      blockId,
      name: input.name,
      roomType: input.roomType,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
    },
  });
}

export async function updateRoom(
  id: number,
  institutionId: number,
  input: UpdateRoomInput
) {
  await findOwnedRoom(id, institutionId);
  return prisma.campusRoom.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.roomType !== undefined ? { roomType: input.roomType } : {}),
      ...(input.x !== undefined ? { x: input.x } : {}),
      ...(input.y !== undefined ? { y: input.y } : {}),
      ...(input.width !== undefined ? { width: input.width } : {}),
      ...(input.height !== undefined ? { height: input.height } : {}),
    },
  });
}

export async function deleteRoom(id: number, institutionId: number) {
  await findOwnedRoom(id, institutionId);
  await prisma.campusRoom.delete({ where: { id } });
}

export async function setPointPosition(
  pointId: number,
  institutionId: number,
  input: SetPointPositionInput
) {
  const point = await prisma.accessibilityPoint.findFirst({
    where: { id: pointId, institutionId },
    select: { id: true },
  });
  if (!point) throw new AppError(404, "Recurso de acessibilidade não encontrado.");

  if (input.mapBlockId !== null) {
    await findOwnedBlock(input.mapBlockId, institutionId);
  }

  return prisma.accessibilityPoint.update({
    where: { id: pointId },
    data: {
      mapBlockId: input.mapBlockId,
      mapX: input.mapX,
      mapY: input.mapY,
    },
    include: pointInclude,
  });
}

export async function getPublicCampusMap(institutionId: number) {
  const institution = await prisma.institution.findFirst({
    where: {
      id: institutionId,
      active: true,
      user: { is: { role: "INSTITUTION", status: "ACTIVE" } },
    },
    select: { userId: true },
  });
  if (!institution) {
    throw new AppError(404, "Instituição não encontrada ou indisponível.");
  }

  const [blocks, points] = await Promise.all([
    prisma.campusBlock.findMany({
      where: { institutionId: institution.userId },
      include: { rooms: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }),
    prisma.accessibilityPoint.findMany({
      where: {
        institutionId: institution.userId,
        active: true,
        mapX: { not: null },
        mapY: { not: null },
      },
      include: pointInclude,
      orderBy: [{ categoryId: "asc" }, { id: "asc" }],
    }),
  ]);

  return {
    blocks,
    points: points.map(({ reportCount, ...point }) => ({
      ...point,
      underReview: reportCount >= REPORT_THRESHOLD,
    })),
  };
}
