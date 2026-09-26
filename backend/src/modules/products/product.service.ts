import { Decimal } from "@prisma/client/runtime/library";
import { LocationType, OperationStatus } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";

export interface CreateProductInput {
  sku: string;
  name: string;
  categoryId: string;
  uom?: string;
  perUnitCost?: number;
  minReorderQty?: number;
  initialStock?: number;
  initialLocationId?: string;
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  uom?: string;
  perUnitCost?: number;
  minReorderQty?: number;
  isActive?: boolean;
}

export class ProductService {
  static async listProducts(filters?: {
    categoryId?: string;
    search?: string;
    lowStockOnly?: boolean;
  }) {
    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true },
        },
        quants: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                shortCode: true,
                type: true,
                warehouse: {
                  select: { id: true, name: true, shortCode: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Compute On-Hand and Free-To-Use metrics per product
    const productIds = products.map((p) => p.id);

    // Sum up reserved quantities for products currently tied up in READY moves
    const reservedMoves = await prisma.stockMove.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        status: { in: [OperationStatus.READY] },
        sourceLocation: {
          type: LocationType.INTERNAL,
        },
      },
      _sum: {
        qtyDemanded: true,
      },
    });

    const reservedMap = new Map<string, number>();
    for (const item of reservedMoves) {
      reservedMap.set(item.productId, item._sum.qtyDemanded ? Number(item._sum.qtyDemanded) : 0);
    }

    const enriched = products.map((prod) => {
      // Physical on hand: sum of quants in INTERNAL locations only
      const onHand = prod.quants
        .filter((q) => q.location.type === LocationType.INTERNAL)
        .reduce((sum, q) => sum + Number(q.quantity), 0);

      const reserved = reservedMap.get(prod.id) || 0;
      const freeToUse = Math.max(0, onHand - reserved);
      const minReorder = Number(prod.minReorderQty);
      const isLowStock = onHand <= minReorder;
      const isOutOfStock = onHand <= 0;

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        uom: prod.uom,
        perUnitCost: Number(prod.perUnitCost),
        minReorderQty: minReorder,
        onHand,
        reserved,
        freeToUse,
        isLowStock,
        isOutOfStock,
        locations: prod.quants
          .filter((q) => Number(q.quantity) > 0)
          .map((q) => ({
            locationId: q.locationId,
            locationName: q.location.name,
            warehouse: q.location.warehouse?.name,
            type: q.location.type,
            quantity: Number(q.quantity),
          })),
      };
    });

    if (filters?.lowStockOnly) {
      return enriched.filter((p) => p.isLowStock);
    }

    return enriched;
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        quants: {
          include: {
            location: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const onHand = product.quants
      .filter((q) => q.location.type === LocationType.INTERNAL)
      .reduce((sum, q) => sum + Number(q.quantity), 0);

    const reservedSum = await prisma.stockMove.aggregate({
      where: {
        productId: id,
        status: OperationStatus.READY,
        sourceLocation: { type: LocationType.INTERNAL },
      },
      _sum: { qtyDemanded: true },
    });

    const reserved = reservedSum._sum.qtyDemanded ? Number(reservedSum._sum.qtyDemanded) : 0;
    const freeToUse = Math.max(0, onHand - reserved);

    return {
      ...product,
      perUnitCost: Number(product.perUnitCost),
      minReorderQty: Number(product.minReorderQty),
      onHand,
      reserved,
      freeToUse,
      isLowStock: onHand <= Number(product.minReorderQty),
      isOutOfStock: onHand <= 0,
    };
  }

  static async createProduct(input: CreateProductInput) {
    const cleanSku = input.sku.trim().toUpperCase();

    const existing = await prisma.product.findUnique({
      where: { sku: cleanSku },
    });

    if (existing) {
      throw new AppError(`Product with SKU '${cleanSku}' already exists`, 409);
    }

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new AppError("Invalid category ID", 400);
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: cleanSku,
          name: input.name.trim(),
          categoryId: input.categoryId,
          uom: input.uom?.trim() || "Units",
          perUnitCost: input.perUnitCost !== undefined ? new Decimal(input.perUnitCost) : new Decimal(0),
          minReorderQty:
            input.minReorderQty !== undefined ? new Decimal(input.minReorderQty) : new Decimal(0),
        },
      });

      // Handle optional initial stock
      if (input.initialStock && input.initialStock > 0 && input.initialLocationId) {
        const location = await tx.location.findUnique({
          where: { id: input.initialLocationId },
        });

        if (!location) {
          throw new AppError("Specified initial location was not found", 404);
        }

        // Upsert quant
        await tx.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: product.id,
              locationId: location.id,
            },
          },
          update: {
            quantity: { increment: new Decimal(input.initialStock) },
          },
          create: {
            productId: product.id,
            locationId: location.id,
            quantity: new Decimal(input.initialStock),
          },
        });

        // Get or create virtual vendor location for ledger audit
        let vendorLoc = await tx.location.findFirst({
          where: { type: LocationType.VENDOR, warehouseId: null },
        });

        if (!vendorLoc) {
          vendorLoc = await tx.location.create({
            data: {
              name: "Vendors",
              shortCode: "VENDORS",
              type: LocationType.VENDOR,
            },
          });
        }

        // Record initial stock move in immutable ledger
        await tx.stockLedger.create({
          data: {
            productId: product.id,
            fromLocationId: vendorLoc.id,
            toLocationId: location.id,
            quantity: new Decimal(input.initialStock),
            referenceNo: "INITIAL-STOCK",
            notes: "Initial inventory setup on product creation",
          },
        });
      }

      return product;
    });
  }

  static async updateProduct(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new AppError("Invalid category ID", 400);
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.uom && { uom: input.uom.trim() }),
        ...(input.perUnitCost !== undefined && { perUnitCost: new Decimal(input.perUnitCost) }),
        ...(input.minReorderQty !== undefined && { minReorderQty: new Decimal(input.minReorderQty) }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  }
}
