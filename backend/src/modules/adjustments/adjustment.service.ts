import { Decimal } from "@prisma/client/runtime/library";
import { LocationType, OperationStatus, OperationType } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import { LocationService } from "../locations/location.service.js";
import { SequenceService } from "../sequences/sequence.service.js";

export interface StockAdjustmentInput {
  productId: string;
  locationId: string;
  countedQty: number;
  reason?: string;
  userId?: string;
}

export class AdjustmentService {
  /**
   * Reconciles physical count with recorded stock by generating compensating double-entry moves.
   */
  static async adjustStock(input: StockAdjustmentInput) {
    if (input.countedQty < 0) {
      throw new AppError("Counted physical quantity cannot be negative.", 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const location = await prisma.location.findUnique({
      where: { id: input.locationId },
      include: { warehouse: true },
    });
    if (!location) {
      throw new AppError("Location not found", 404);
    }

    if (location.type !== LocationType.INTERNAL) {
      throw new AppError("Stock adjustments can only be performed on physical internal locations.", 400);
    }

    const warehouseCode = location.warehouse?.shortCode || "WH";

    // Fetch virtual inventory loss location
    const lossLocation = await LocationService.getVirtualLocation(LocationType.INVENTORY_LOSS);

    return prisma.$transaction(async (tx) => {
      // 1. Fetch current quant
      const quant = await tx.stockQuant.findUnique({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.locationId,
          },
        },
      });

      const recordedQty = quant ? Number(quant.quantity) : 0;
      const countedQty = input.countedQty;
      const delta = countedQty - recordedQty;

      if (delta === 0) {
        return {
          message: "Physical count matches recorded inventory. No adjustment required.",
          recordedQty,
          countedQty,
          delta: 0,
        };
      }

      // 2. Generate standard reference: e.g. WH/ADJ/0001
      const referenceNo = await SequenceService.getNextReference(
        warehouseCode,
        OperationType.ADJUSTMENT,
        tx
      );

      // 3. Determine move direction
      let sourceLocId: string;
      let destLocId: string;
      const absDelta = Math.abs(delta);

      if (delta > 0) {
        // Surplus: move from Virtual Inventory Loss -> Internal Location
        sourceLocId = lossLocation.id;
        destLocId = location.id;
      } else {
        // Shrinkage/Damage: move from Internal Location -> Virtual Inventory Loss
        sourceLocId = location.id;
        destLocId = lossLocation.id;
      }

      // 4. Create StockOperation record (auto DONE)
      const operation = await tx.stockOperation.create({
        data: {
          referenceNo,
          type: OperationType.ADJUSTMENT,
          status: OperationStatus.DONE,
          warehouseId: location.warehouseId || (await tx.warehouse.findFirst())!.id,
          responsibleUserId: input.userId || null,
          scheduledDate: new Date(),
          notes: input.reason || `Physical Count Adjustment: ${recordedQty} -> ${countedQty} (Delta: ${delta > 0 ? "+" : ""}${delta})`,
        },
      });

      // 5. Create StockMove (DONE)
      const move = await tx.stockMove.create({
        data: {
          operationId: operation.id,
          productId: input.productId,
          sourceLocationId: sourceLocId,
          destLocationId: destLocId,
          qtyDemanded: new Decimal(absDelta),
          qtyDone: new Decimal(absDelta),
          status: OperationStatus.DONE,
        },
      });

      // 6. Update the physical location quant to exact counted quantity
      await tx.stockQuant.upsert({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.locationId,
          },
        },
        update: {
          quantity: new Decimal(countedQty),
        },
        create: {
          productId: input.productId,
          locationId: input.locationId,
          quantity: new Decimal(countedQty),
        },
      });

      // Update virtual loss quant counter
      if (delta > 0) {
        // Loss location was source
        await tx.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: input.productId,
              locationId: lossLocation.id,
            },
          },
          update: { quantity: { decrement: new Decimal(absDelta) } },
          create: {
            productId: input.productId,
            locationId: lossLocation.id,
            quantity: new Decimal(0).minus(new Decimal(absDelta)),
          },
        });
      } else {
        // Loss location was dest
        await tx.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: input.productId,
              locationId: lossLocation.id,
            },
          },
          update: { quantity: { increment: new Decimal(absDelta) } },
          create: {
            productId: input.productId,
            locationId: lossLocation.id,
            quantity: new Decimal(absDelta),
          },
        });
      }

      // 7. Write to immutable Stock Ledger
      await tx.stockLedger.create({
        data: {
          moveId: move.id,
          productId: input.productId,
          fromLocationId: sourceLocId,
          toLocationId: destLocId,
          quantity: new Decimal(absDelta),
          userId: input.userId || null,
          referenceNo,
          notes: operation.notes,
        },
      });

      return {
        referenceNo,
        productId: input.productId,
        productName: product.name,
        locationName: location.name,
        previousQty: recordedQty,
        adjustedQty: countedQty,
        delta,
        status: "DONE",
      };
    });
  }
}
