
import { prisma } from "../../db/prisma.js";
import { AuthError } from "../../services/auth.service.js";
import {
  generateTemporaryPassword,
  hashPassword,
} from "../../utils/password.js";
import { normalizeCnpj } from "../../utils/cnpj.js";
import type {
  CreateInstitutionInput,
  UpdateInstitutionInput,
  ListInstitutionsQuery,
  PublicInstitutionsQuery,
} from "./institutions.schemas.js";
// Verifica se o erro corresponde a uma restrição de unicidade do Prisma.
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

// Cadastro de uma instituição e sua conta de acesso.
export async function createInstitution(input: CreateInstitutionInput) {
  const cnpj = normalizeCnpj(input.cnpj);
  const email = input.email.trim().toLowerCase();

  // Verifica se já existe uma instituição com esse CNPJ.
  const existingInstitution = await prisma.institution.findUnique({
    where: { cnpj },
    select: { id: true },
  });

  if (existingInstitution) {
    throw new AuthError(
      409,
      "Já existe uma instituição cadastrada com este CNPJ."
    );
  }

  // Verifica se o CNPJ já está sendo utilizado como login.
  const existingLogin = await prisma.user.findUnique({
    where: { login: cnpj },
    select: { id: true },
  });

  if (existingLogin) {
    throw new AuthError(
      409,
      "Este CNPJ já está associado a uma conta."
    );
  }

  // O e-mail da instituição também será utilizado na conta de acesso.
  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingEmail) {
    throw new AuthError(
      409,
      "Este e-mail já está em uso por outra conta."
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  // Cria os dois registros na mesma transação.
  let institution;

  try {
    institution = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          login: cnpj,
          email,
          passwordHash,
          role: "INSTITUTION",
          isTemporaryPassword: true,
        },
      });

      return tx.institution.create({
        data: {
          ...input,
          cnpj,
          email,
          userId: user.id,
        },
      });
    });
  } catch (error) {
    // Trata duplicidades que possam ocorrer durante a transação.
    if (isUniqueConstraintError(error)) {
      throw new AuthError(
        409,
        "Já existe uma instituição ou conta cadastrada com este CNPJ ou e-mail."
      );
    }

    throw error;
  }

  return {
    institution,
    credentials: {
      login: cnpj,
      temporaryPassword,
    },
  };
}

// Atualiza os dados de uma instituição e de sua conta de acesso.
export async function updateInstitution(
  id: number,
  input: UpdateInstitutionInput
) {
  const cnpj = input.cnpj
    ? normalizeCnpj(input.cnpj)
    : undefined;

  const email = input.email
    ? input.email.trim().toLowerCase()
    : undefined;

  try {
    return await prisma.$transaction(async (tx) => {
      // Verifica se a instituição existe e recupera sua conta vinculada.
      const existingInstitution = await tx.institution.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!existingInstitution) {
        throw new AuthError(404, "Instituição não encontrada.");
      }

      // O CNPJ é permanente e não pode ser alterado.
      if (cnpj && cnpj !== existingInstitution.cnpj) {
        throw new AuthError(
          400,
          "O CNPJ da instituição não pode ser alterado."
        );
      }

      // Verifica se o novo e-mail já pertence a outra conta.
      if (email) {
        const duplicateEmail = await tx.user.findFirst({
          where: {
            email,
            id: { not: existingInstitution.userId },
          },
          select: { id: true },
        });

        if (duplicateEmail) {
          throw new AuthError(
            409,
            "Este e-mail já está em uso por outra conta."
          );
        }
      }

      // Atualiza os dados da conta de acesso.
      await tx.user.update({
        where: { id: existingInstitution.userId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(email !== undefined ? { email } : {}),
        },
      });

      // Atualiza os dados da instituição.
      return tx.institution.update({
        where: { id },
        data: {
          ...input,
          cnpj: existingInstitution.cnpj,
          ...(email ? { email } : {}),
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AuthError(
        409,
        "Já existe uma conta cadastrada com este e-mail."
      );
    }

    throw error;
  }
}


// Lista instituições para a área administrativa, com filtros e paginação.
export async function listInstitutions(
  filters: ListInstitutionsQuery
) {
  const { page, limit, active, search } = filters;

  // Define os filtros da consulta.
  const where = {
    ...(active !== "all" ? { active: active === "true" } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { cnpj: { contains: search } },
            { email: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {}),
  };

  // Calcula quantos registros devem ser ignorados.
  const skip = (page - 1) * limit;

  // Executa a consulta e a contagem em paralelo.
  const [institutions, total] = await Promise.all([
    prisma.institution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),

    prisma.institution.count({ where }),
  ]);

  return {
    institutions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}



// Ativa ou inativa uma instituição e sua conta de acesso.
export async function updateInstitutionStatus(
  id: number,
  active: boolean
) {
  return prisma.$transaction(async (tx) => {
    // Verifica se a instituição existe e recupera o status da conta.
    const existingInstitution = await tx.institution.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!existingInstitution) {
      throw new AuthError(404, "Instituição não encontrada.");
    }

    // Atualiza a situação da instituição.
    const institution = await tx.institution.update({
      where: { id },
      data: { active },
    });

    // Preserva o status de suspensão da conta.
    const accountStatus =
      existingInstitution.user.status === "SUSPENDED"
        ? "SUSPENDED"
        : active
          ? "ACTIVE"
          : "INACTIVE";

    // Sincroniza o status da conta vinculada.
    await tx.user.update({
      where: { id: existingInstitution.userId },
      data: {
        status: accountStatus,
      },
    });

    return institution;
  });
}

 // Lista instituições ativas para consulta pública.
export async function listPublicInstitutions(
  filters: PublicInstitutionsQuery
) {
  const { search } = filters;

  // Define os filtros da consulta pública.
  const where = {
    active: true,
    user: {
      is: {
        status: "ACTIVE" as const,
      },
    },
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {}),
  };

  // Busca somente os dados necessários para a consulta pública.
  const institutions = await prisma.institution.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      street: true,
      number: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      latitude: true,
      longitude: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return institutions;
}

 // Busca os detalhes públicos de uma instituição.
export async function getPublicInstitutionById(id: number) {
  const institution = await prisma.institution.findFirst({
    where: {
      id,
      active: true,
      user: {
        is: {
          status: "ACTIVE",
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      phone: true,
      email: true,
      street: true,
      number: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!institution) {
    throw new AuthError(404, "Instituição não encontrada.");
  }

  return institution;
}

 // Lista instituições ativas para exibição no mapa.
export async function listPublicInstitutionsMap() {
  const institutions = await prisma.institution.findMany({
    where: {
      active: true,
      user: {
        is: {
          status: "ACTIVE",
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return institutions;
}
