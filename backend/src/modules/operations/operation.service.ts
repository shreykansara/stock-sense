import { Decimal } from "@prisma/client/runtime/library";
import { LocationType, OperationStatus, OperationType } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import { SequenceService } from "../sequences/sequence.service.js";
import { LocationService } from "../locations/location.service.js";
import { TransferEngine, TransferResult } from "./transfer.engine.js";

export interface CreateOperationMoveInput {
  productId: string;
  qtyDemanded: number;
  sourceLocationId?: string;
  destLocationId?: string;
}

export interface CreateOperationInput {
  type: OperationType;
  warehouseId: string;
  partnerId?: string;
  responsibleUserId?: string;
  scheduledDate?: string | Date;
  notes?: string;
  moves: CreateOperationMoveInput[];
}

export class OperationService {
  static async listOperations(filters?: {
    type?: OperationType;
    status?: OperationStatus;
    warehouseId?: string;
    search?: string;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters?.search) {
      where.OR = [
        { referenceNo: { contains: filters.search, mode: "insensitive" } },
        { partner: { name: { contains: filters.search, mode: "insensitive" } } },
        { notes: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.stockOperation.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true, shortCode: true },
        },
        partner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        responsibleUser: {
          select: { id: true, name: true, email: true },
        },
        moves: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, uom: true },
            },
            sourceLocation: {
              select: { id: true, name: true, shortCode: true, type: true },
            },
            destLocation: {
              select: { id: true, name: true, shortCode: true, type: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOperationById(id: string) {
    const operation = await prisma.stockOperation.findUnique({
      where: { id },
      include: {
        warehouse: true,
        partner: true,
        responsibleUser: true,
        moves: {
          include: {
            product: {
              include: { category: true },
            },
            sourceLocation: true,
            destLocation: true,
          },
        },
      },
    });

    if (!operation) {
      throw new AppError("Stock Operation not found", 404);
    }

    // Compute live line-level availability for ground view
    const enrichedMoves = await Promise.all(
      operation.moves.map(async (move) => {
        let availableQty = 0;
        let isAvailable = true;

        if (move.sourceLocation.type === LocationType.INTERNAL) {
          const quant = await prisma.stockQuant.findUnique({
            where: {
              productId_locationId: {
                productId: move.productId,
                locationId: move.sourceLocationId,
              },
            },
          });
          availableQty = quant ? Number(quant.quantity) : 0;
          isAvailable = availableQty >= Number(move.qtyDemanded);
        } else {
          // Vendor or virtual source has unlimited incoming supply
          availableQty = Number(move.qtyDemanded);
          isAvailable = true;
        }

        return {
          ...move,
          qtyDemanded: Number(move.qtyDemanded),
          qtyDone: Number(move.qtyDone),
          availableQty,
          isAvailable,
          isShortage: !isAvailable, // Triggers red highlighting on UI line item
        };
      })
    );

    return {
      ...operation,
      moves: enrichedMoves,
    };
  }

  static async createOperation(input: CreateOperationInput) {
    if (!input.moves || input.moves.length === 0) {
      throw new AppError("Operation must contain at least one product line.", 400);
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: input.warehouseId },
      include: { locations: true },
    });

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    // Default physical location for this warehouse
    const defaultStockLocation =
      warehouse.locations.find((l) => l.shortCode === "STOCK" && l.type === LocationType.INTERNAL) ||
      warehouse.locations.find((l) => l.type === LocationType.INTERNAL);

    if (!defaultStockLocation) {
      throw new AppError("Warehouse has no valid internal stock location.", 400);
    }

    // Get virtual locations
    const vendorLoc = await LocationService.getVirtualLocation(LocationType.VENDOR);
    const customerLoc = await LocationService.getVirtualLocation(LocationType.CUSTOMER);

    return prisma.$transaction(async (tx) => {
      // 1. Generate standard sequence reference: e.g. WH/IN/0001
      const referenceNo = await SequenceService.getNextReference(
        warehouse.shortCode,
        input.type,
        tx
      );

      // 2. Create the parent operation in DRAFT
      const operation = await tx.stockOperation.create({
        data: {
          referenceNo,
          type: input.type,
          status: OperationStatus.DRAFT,
          warehouseId: input.warehouseId,
          partnerId: input.partnerId || null,
          responsibleUserId: input.responsibleUserId || null,
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : new Date(),
          notes: input.notes?.trim(),
        },
      });

      // 3. Create moves
      for (const line of input.moves) {
        let sourceLocId = line.sourceLocationId;
        let destLocId = line.destLocationId;

        // Auto-assign smart default locations according to operation type
        if (input.type === OperationType.RECEIPT) {
          sourceLocId = sourceLocId || vendorLoc.id;
          destLocId = destLocId || defaultStockLocation.id;
        } else if (input.type === OperationType.DELIVERY) {
          sourceLocId = sourceLocId || defaultStockLocation.id;
          destLocId = destLocId || customerLoc.id;
        } else if (input.type === OperationType.INTERNAL) {
          if (!sourceLocId || !destLocId) {
            throw new AppError(
              "Both source and destination locations are required for internal transfers.",
              400
            );
          }
        }

        if (!sourceLocId || !destLocId) {
          throw new AppError("Invalid source or destination location for move.", 400);
        }

        if (sourceLocId === destLocId) {
          throw new AppError("Source and destination locations cannot be identical.", 400);
        }

        await tx.stockMove.create({
          data: {
            operationId: operation.id,
            productId: line.productId,
            sourceLocationId: sourceLocId,
            destLocationId: destLocId,
            qtyDemanded: new Decimal(line.qtyDemanded),
            status: OperationStatus.DRAFT,
          },
        });
      }

      return tx.stockOperation.findUnique({
        where: { id: operation.id },
        include: {
          moves: {
            include: { product: true, sourceLocation: true, destLocation: true },
          },
          warehouse: true,
          partner: true,
        },
      });
    });
  }

  /**
   * Evaluates stock availability across all line items.
   * If all lines have sufficient stock, transitions from DRAFT/WAITING -> READY.
   * If stock is insufficient, sets status to WAITING and returns shortage details.
   */
  static async checkAvailability(operationId: string) {
    const operation = await prisma.stockOperation.findUnique({
      where: { id: operationId },
      include: {
        moves: {
          include: { product: true, sourceLocation: true },
        },
      },
    });

    if (!operation) {
      throw new AppError("Operation not found", 404);
    }

    if (operation.status === OperationStatus.DONE) {
      throw new AppError("Operation is already completed (DONE).", 400);
    }

    if (operation.status === OperationStatus.CANCELED) {
      throw new AppError("Cannot check availability on a canceled operation.", 400);
    }

    const shortages: Array<{
      productId: string;
      sku: string;
      productName: string;
      locationName: string;
      demanded: number;
      available: number;
    }> = [];

    for (const move of operation.moves) {
      if (move.sourceLocation.type === LocationType.INTERNAL) {
        const quant = await prisma.stockQuant.findUnique({
          where: {
            productId_locationId: {
              productId: move.productId,
              locationId: move.sourceLocationId,
            },
          },
        });

        const available = quant ? Number(quant.quantity) : 0;
        const demanded = Number(move.qtyDemanded);

        if (available < demanded) {
          shortages.push({
            productId: move.productId,
            sku: move.product.sku,
            productName: move.product.name,
            locationName: move.sourceLocation.name,
            demanded,
            available,
          });
        }
      }
    }

    const newStatus = shortages.length === 0 ? OperationStatus.READY : OperationStatus.WAITING;

    await prisma.$transaction([
      prisma.stockOperation.update({
        where: { id: operationId },
        data: { status: newStatus },
      }),
      prisma.stockMove.updateMany({
        where: { operationId },
        data: { status: newStatus },
      }),
    ]);

    return {
      operationId,
      status: newStatus,
      isFullyAvailable: shortages.length === 0,
      shortages,
    };
  }

  /**
   * Validates and executes the stock transfer (Ready -> Done)
   */
  static async validateOperation(
    operationId: string,
    userId?: string
  ): Promise<TransferResult> {
    return TransferEngine.executeOperation(operationId, userId);
  }

  /**
   * Cancels an operation if it is not already DONE
   */
  static async cancelOperation(operationId: string) {
    const operation = await prisma.stockOperation.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new AppError("Operation not found", 404);
    }

    if (operation.status === OperationStatus.DONE) {
      throw new AppError("Cannot cancel an operation that has already been validated and executed.", 400);
    }

    return prisma.$transaction([
      prisma.stockOperation.update({
        where: { id: operationId },
        data: { status: OperationStatus.CANCELED },
      }),
      prisma.stockMove.updateMany({
        where: { operationId },
        data: { status: OperationStatus.CANCELED },
      }),
    ]);
  }
}
