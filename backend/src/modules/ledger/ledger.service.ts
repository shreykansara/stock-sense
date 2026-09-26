import { LocationType } from "@prisma/client";
import { prisma } from "../../db/client.js";

export interface LedgerFilters {
  productId?: string;
  referenceNo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export class LedgerService {
  static async listLedgerEntries(filters?: LedgerFilters) {
    const where: Record<string, unknown> = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.referenceNo) {
      where.referenceNo = { contains: filters.referenceNo, mode: "insensitive" };
    }

    if (filters?.search) {
      where.OR = [
        { referenceNo: { contains: filters.search, mode: "insensitive" } },
        { product: { name: { contains: filters.search, mode: "insensitive" } } },
        { product: { sku: { contains: filters.search, mode: "insensitive" } } },
        { fromLocation: { name: { contains: filters.search, mode: "insensitive" } } },
        { toLocation: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      };
    }

    const limit = filters?.limit ? Math.min(filters.limit, 100) : 50;
    const offset = filters?.offset || 0;

    const [total, entries] = await Promise.all([
      prisma.stockLedger.count({ where }),
      prisma.stockLedger.findMany({
        where,
        include: {
          product: {
            select: { id: true, sku: true, name: true, uom: true },
          },
          fromLocation: {
            select: { id: true, name: true, shortCode: true, type: true },
          },
          toLocation: {
            select: { id: true, name: true, shortCode: true, type: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          move: {
            include: {
              operation: {
                select: {
                  id: true,
                  referenceNo: true,
                  type: true,
                  status: true,
                  scheduledDate: true,
                  partner: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    const formatted = entries.map((entry) => {
      let direction: "IN" | "OUT" | "INTERNAL" | "ADJUSTMENT" = "INTERNAL";
      let displayColor: "green" | "red" | "blue" | "orange" = "blue";

      const fromType = entry.fromLocation.type;
      const toType = entry.toLocation.type;

      if (fromType === LocationType.VENDOR && toType === LocationType.INTERNAL) {
        direction = "IN";
        displayColor = "green";
      } else if (fromType === LocationType.INTERNAL && toType === LocationType.CUSTOMER) {
        direction = "OUT";
        displayColor = "red";
      } else if (fromType === LocationType.INVENTORY_LOSS || toType === LocationType.INVENTORY_LOSS) {
        direction = "ADJUSTMENT";
        displayColor = "orange";
      } else {
        direction = "INTERNAL";
        displayColor = "blue";
      }

      return {
        id: entry.id,
        referenceNo: entry.referenceNo,
        date: entry.createdAt,
        contact: entry.move?.operation?.partner?.name || entry.user?.name || "System",
        product: entry.product,
        quantity: Number(entry.quantity),
        fromLocation: entry.fromLocation.name,
        toLocation: entry.toLocation.name,
        direction,
        displayColor, // Green for IN, Red for OUT as requested by blueprint
        status: "DONE",
        notes: entry.notes,
      };
    });

    return {
      total,
      limit,
      offset,
      data: formatted,
    };
  }
}
