import { prisma } from "../../db/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { CreateReviewInput, ListReviewsQuery } from "./reviews.schemas.js";

async function assertInstitution(institutionId: number): Promise<void> {
  const institution = await prisma.institution.findFirst({
    where: {
      id: institutionId,
      active: true,
      user: {
        is: { status: "ACTIVE" },
      },
    },
    select: { id: true },
  });

  if (!institution) {
    throw new AppError(404, "Instituição não encontrada ou indisponível.");
  }
}

async function getReviewSummary(institutionId: number) {
  const result = await prisma.review.aggregate({
    where: {
      institutionId,
      active: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  return {
    averageRating: result._avg.rating ?? 0,
    totalReviews: result._count._all,
  };
}


export async function createReview(
  institutionId: number,
  input: CreateReviewInput,
) {
  await assertInstitution(institutionId);

  const review = await prisma.review.create({
    data: {
      institutionId,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      rating: input.rating,
      comment: input.comment,
    },
    select: {
      id: true,
      institutionId: true,
      authorName: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  });

  const summary = await getReviewSummary(institutionId);

  return {
    review,
    ...summary,
  };
}


export async function listPublicReviews(
  institutionId: number,
  filters: ListReviewsQuery,
) {
  await assertInstitution(institutionId);

  const { sort, rating } = filters;

  const orderBy = {
    recent: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    oldest: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    highest: [{ rating: "desc" as const }, { createdAt: "desc" as const }],
    lowest: [{ rating: "asc" as const }, { createdAt: "asc" as const }],
  }[sort];

  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      where: {
        institutionId,
        active: true,
        ...(rating !== undefined ? { rating } : {}),
      },
      select: {
        id: true,
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy,
    }),

    getReviewSummary(institutionId),
  ]);

  return {
    data: reviews,
    ...summary,
  };
}

export async function moderateReview(reviewId: number, adminId: number) {
  if (!Number.isSafeInteger(adminId) || adminId <= 0) {
    throw new AppError(400, "Identificação do administrador inválida.");
  }

  const institutionId = await prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        active: true,
        institutionId: true,
      },
    });

    if (!review || !review.active) {
      throw new AppError(404, "Avaliação não encontrada ou já removida.");
    }

    await tx.review.update({
      where: { id: reviewId },
      data: { active: false },
    });

    await tx.auditLog.create({
      data: {
        adminId,
        action: "REVIEW_DEACTIVATED",
        targetEntity: "Review",
        targetId: reviewId,
        details: "Avaliação desativada por moderação administrativa.",
      },
    });

    return review.institutionId;
  });

  const summary = await getReviewSummary(institutionId);

  return {
    message: "Avaliação removida com sucesso.",
    reviewId,
    ...summary,
  };
}