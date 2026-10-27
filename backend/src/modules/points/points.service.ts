import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../lib/errors.js";
import { MAX_IMAGES_PER_POINT, PUBLIC_URL_PREFIX, UPLOAD_DIR } from "../../lib/upload.js";
import type { CreatePointInput, UpdatePointInput } from "./points.schemas.js";

export const REPORT_THRESHOLD = 3; // RN13: a partir de 3 denúncias o ponto fica "em verificação"

const pointInclude = {
  category: true,
  images: { select: { id: true, imageUrl: true, altText: true } },
} as const;

// ---------- auxiliares ----------

export async function discardFiles(files: Express.Multer.File[] = []): Promise<void> {
  await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));
}

async function discardUrls(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map((url) => fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => undefined)),
  );
}

// RN10: nenhuma foto sem texto alternativo.
function assertAltTexts(files: Express.Multer.File[], altTexts: string[]): void {
  if (altTexts.length !== files.length) {
    throw new AppError(
      400,
      'Cada imagem precisa de um texto alternativo (campo "altTexts", na mesma ordem dos arquivos).',
    );
  }
}

// RN08: só categorias pré-definidas.
async function assertCategory(categoryId: number): Promise<void> {
  const category = await prisma.accessibilityCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw new AppError(400, "Categoria de acessibilidade inexistente.");
}

// RN09: busca já filtrando pelo dono; ponto de outra instituição responde 404 (não revela que existe).
async function findOwnedPoint(id: number, institutionId: number) {
  const point = await prisma.accessibilityPoint.findFirst({
    where: { id, institutionId },
    include: { images: true },
  });
  if (!point) throw new AppError(404, "Ponto de acessibilidade não encontrado.");
  return point;
}

function newImages(files: Express.Multer.File[], altTexts: string[]) {
  return files.map((file, index) => ({
    imageUrl: `${PUBLIC_URL_PREFIX}/${file.filename}`,
    altText: altTexts[index] as string, // tamanho já conferido em assertAltTexts
  }));
}

// ---------- rotas da instituição ----------

export async function createPoint(
  institutionId: number,
  input: CreatePointInput,
  files: Express.Multer.File[],
) {
  assertAltTexts(files, input.altTexts);
  await assertCategory(input.categoryId);

  return prisma.accessibilityPoint.create({
    data: {
      institutionId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      active: input.active ?? false, // RN12: nasce oculto até a instituição ativar
      images: { create: newImages(files, input.altTexts) },
    },
    include: pointInclude,
  });
}

export async function updatePoint(
  id: number,
  institutionId: number,
  input: UpdatePointInput,
  files: Express.Multer.File[],
) {
  const point = await findOwnedPoint(id, institutionId);
  assertAltTexts(files, input.altTexts);

  const existingIds = new Set(point.images.map((image) => image.id));
  const removeIds = [...new Set(input.removeImageIds)];

  if (removeIds.some((imageId) => !existingIds.has(imageId))) {
    throw new AppError(400, "removeImageIds contém imagem que não pertence a este ponto.");
  }
  const removed = new Set(removeIds);
  if (input.imageAlts.some((item) => !existingIds.has(item.id) || removed.has(item.id))) {
    throw new AppError(400, "imageAlts contém imagem inexistente neste ponto ou marcada para remoção.");
  }
  // RN11: no máximo 5 fotos depois da alteração.
  if (point.images.length - removeIds.length + files.length > MAX_IMAGES_PER_POINT) {
    throw new AppError(400, `Cada ponto pode ter no máximo ${MAX_IMAGES_PER_POINT} imagens.`);
  }
  if (input.categoryId !== undefined) await assertCategory(input.categoryId);

  const updated = await prisma.$transaction(async (tx) => {
    if (removeIds.length) {
      await tx.accessibilityImage.deleteMany({ where: { pointId: id, id: { in: removeIds } } });
    }
    for (const item of input.imageAlts) {
      await tx.accessibilityImage.update({ where: { id: item.id }, data: { altText: item.altText } });
    }
    return tx.accessibilityPoint.update({
      where: { id },
      data: {
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        active: input.active,
        images: { create: newImages(files, input.altTexts) },
      },
      include: pointInclude,
    });
  });

  await discardUrls(point.images.filter((image) => removed.has(image.id)).map((image) => image.imageUrl));
  return updated;
}

export async function deletePoint(id: number, institutionId: number): Promise<void> {
  const point = await findOwnedPoint(id, institutionId);
  await prisma.accessibilityPoint.delete({ where: { id } }); // as imagens saem junto (cascade)
  await discardUrls(point.images.map((image) => image.imageUrl));
}

// ---------- rotas públicas ----------

export async function listCategories() {
  return prisma.accessibilityCategory.findMany({ orderBy: { name: "asc" } });
}

export async function listPublicPoints(institutionId: number, categoryIds: number[]) {
  // A instituição é um User com perfil INSTITUTION e conta ativa.
  const institution = await prisma.user.findFirst({
    where: { id: institutionId, role: "INSTITUTION", status: "ACTIVE" },
    select: { id: true },
  });
  if (!institution) throw new AppError(404, "Instituição não encontrada ou indisponível.");

  const visible = { institutionId, active: true }; // RN12

  const [points, availableCategories] = await Promise.all([
    prisma.accessibilityPoint.findMany({
      where: { ...visible, ...(categoryIds.length ? { categoryId: { in: categoryIds } } : {}) },
      include: pointInclude,
      orderBy: [{ categoryId: "asc" }, { id: "asc" }],
    }),
    // UC07: o checklist mostra só as categorias que a unidade realmente tem.
    prisma.accessibilityCategory.findMany({
      where: { points: { some: visible } },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    data: points.map(({ reportCount, ...point }) => ({
      ...point,
      underReview: reportCount >= REPORT_THRESHOLD, // RN13
    })),
    availableCategories,
  };
}