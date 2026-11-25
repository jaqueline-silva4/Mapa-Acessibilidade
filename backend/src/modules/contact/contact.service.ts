import { prisma } from "../../db/prisma.js";
import type { CreateContactInput } from "./contact.schemas.js";

export async function createContactMessage(data: CreateContactInput) {
  return prisma.contactMessage.create({
    data: {
      ...data,
      status: "PENDING",
    },
  });
}

export async function listContactMessages() {
  return prisma.contactMessage.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateContactMessageStatus(
  id: number,
  status: "PENDING" | "ANSWERED"
) {
  return prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
}