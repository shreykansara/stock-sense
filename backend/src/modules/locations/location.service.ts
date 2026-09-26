import { LocationType } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";

export interface CreateLocationInput {
  warehouseId?: string;
  name: string;
  shortCode: string;
  type?: LocationType;
}

export interface UpdateLocationInput {
  name?: string;
  shortCode?: string;
  isActive?: boolean;
}

export class LocationService {
  /**
   * Automatically initializes standard virtual locations if they don't already exist.
   */
  static async ensureVirtualLocations() {
    const virtualDefaults = [
      { name: "Vendors", shortCode: "VENDORS", type: LocationType.VENDOR },
      { name: "Customers", shortCode: "CUSTOMERS", type: LocationType.CUSTOMER },
      { name: "Inventory Loss", shortCode: "INVENTORY-LOSS", type: LocationType.INVENTORY_LOSS },
      { name: "Production Floor", shortCode: "PRODUCTION", type: LocationType.PRODUCTION },
    ];

    for (const vLoc of virtualDefaults) {
      const existing = await prisma.location.findFirst({
        where: {
          type: vLoc.type,
          warehouseId: null,
        },
      });

      if (!existing) {
        await prisma.location.create({
          data: {
            name: vLoc.name,
            shortCode: vLoc.shortCode,
            type: vLoc.type,
            warehouseId: null,
          },
        });
      }
    }
  }

  static async getVirtualLocation(type: LocationType) {
    let loc = await prisma.location.findFirst({
      where: { type, warehouseId: null },
    });

    if (!loc) {
      await this.ensureVirtualLocations();
      loc = await prisma.location.findFirst({
        where: { type, warehouseId: null },
      });
    }

    if (!loc) {
      throw new AppError(`Virtual location for type '${type}' could not be initialized.`, 500);
    }

    return loc;
  }

  static async listLocations(filters?: {
    warehouseId?: string;
    type?: LocationType;
    search?: string;
  }) {
    const whereClause: Record<string, unknown> = {};

    if (filters?.warehouseId) {
      whereClause.warehouseId = filters.warehouseId;
    }

    if (filters?.type) {
      whereClause.type = filters.type;
    }

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { shortCode: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.location.findMany({
      where: whereClause,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
        _count: {
          select: {
            quants: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }

  static async getLocationById(id: string) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: true,
        quants: {
          where: { quantity: { gt: 0 } },
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { quantity: "desc" },
        },
      },
    });

    if (!location) {
      throw new AppError("Location not found", 404);
    }

    return location;
  }

  static async createLocation(input: CreateLocationInput) {
    const cleanCode = input.shortCode.trim().toUpperCase();
    const locType = input.type || LocationType.INTERNAL;

    if (locType === LocationType.INTERNAL && !input.warehouseId) {
      throw new AppError("Warehouse is required for internal storage locations.", 400);
    }

    if (input.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: input.warehouseId },
      });
      if (!warehouse) {
        throw new AppError("Target warehouse not found", 404);
      }

      const existing = await prisma.location.findUnique({
        where: {
          warehouseId_shortCode: {
            warehouseId: input.warehouseId,
            shortCode: cleanCode,
          },
        },
      });

      if (existing) {
        throw new AppError(
          `Location with short code '${cleanCode}' already exists in this warehouse.`,
          409
        );
      }
    }

    return prisma.location.create({
      data: {
        name: input.name.trim(),
        shortCode: cleanCode,
        type: locType,
        warehouseId: input.warehouseId || null,
      },
      include: {
        warehouse: true,
      },
    });
  }

  static async updateLocation(id: string, input: UpdateLocationInput) {
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      throw new AppError("Location not found", 404);
    }

    return prisma.location.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.shortCode && { shortCode: input.shortCode.trim().toUpperCase() }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  }
}
