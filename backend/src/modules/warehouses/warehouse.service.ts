import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";

export interface CreateWarehouseInput {
  name: string;
  shortCode: string;
  address?: string;
}

export interface UpdateWarehouseInput {
  name?: string;
  shortCode?: string;
  address?: string;
  isActive?: boolean;
}

export class WarehouseService {
  static async listWarehouses() {
    return prisma.warehouse.findMany({
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            type: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            operations: true,
            locations: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async getWarehouseById(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            quants: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    uom: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    return warehouse;
  }

  static async createWarehouse(input: CreateWarehouseInput) {
    const cleanCode = input.shortCode.trim().toUpperCase();

    const existing = await prisma.warehouse.findUnique({
      where: { shortCode: cleanCode },
    });

    if (existing) {
      throw new AppError(`Warehouse with short code '${cleanCode}' already exists.`, 409);
    }

    return prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.create({
        data: {
          name: input.name.trim(),
          shortCode: cleanCode,
          address: input.address?.trim(),
        },
      });

      // Automatically create the primary default internal location for this warehouse: "Stock"
      await tx.location.create({
        data: {
          warehouseId: warehouse.id,
          name: `${warehouse.name} Stock`,
          shortCode: "STOCK",
          type: "INTERNAL",
        },
      });

      return warehouse;
    });
  }

  static async updateWarehouse(id: string, input: UpdateWarehouseInput) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    return prisma.warehouse.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.shortCode && { shortCode: input.shortCode.trim().toUpperCase() }),
        ...(input.address !== undefined && { address: input.address?.trim() }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  }
}
