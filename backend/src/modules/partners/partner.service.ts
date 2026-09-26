import { PartnerType } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";

export interface CreatePartnerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: PartnerType;
}

export class PartnerService {
  static async listPartners(type?: PartnerType) {
    const where: Record<string, unknown> = {};
    if (type) {
      where.OR = [{ type }, { type: PartnerType.BOTH }];
    }

    return prisma.partner.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  static async getPartnerById(id: string) {
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        operations: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!partner) {
      throw new AppError("Partner not found", 404);
    }

    return partner;
  }

  static async createPartner(input: CreatePartnerInput) {
    return prisma.partner.create({
      data: {
        name: input.name.trim(),
        email: input.email?.trim(),
        phone: input.phone?.trim(),
        address: input.address?.trim(),
        type: input.type || PartnerType.BOTH,
      },
    });
  }

  static async updatePartner(id: string, input: Partial<CreatePartnerInput>) {
    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Partner not found", 404);
    }

    return prisma.partner.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.email !== undefined && { email: input.email?.trim() }),
        ...(input.phone !== undefined && { phone: input.phone?.trim() }),
        ...(input.address !== undefined && { address: input.address?.trim() }),
        ...(input.type && { type: input.type }),
      },
    });
  }
}
