import { Decimal } from "@prisma/client/runtime/library";
import { LocationType, OperationStatus, Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";

export interface TransferResult {
  operationId: string;
  referenceNo: string;
  movesProcessed: number;
  lowStockAlerts: Array<{
    productId: string;
    productName: string;
    sku: string;
    onHand: number;
    minReorderQty: number;
  }>;
}

export class TransferEngine {
  /**
   * Executes an atomic double-entry stock transfer for a validated operation.
   * 
   * Transaction Steps:
   * 1. Pessimistically read & lock stock_quants for affected products and locations.
   * 2. Verify source location availability (for physical internal locations).
   * 3. Decrement source quant.
   * 4. Increment destination quant (upsert if non-existent).
   * 5. Record immutable entry into stock_ledger.
   * 6. Transition StockMoves and StockOperation to DONE.
   * 7. Post-commit check for automated low-stock reorder thresholds.
   */
  static async executeOperation(
    operationId: string,
    userId?: string
  ): Promise<TransferResult> {
    return prisma.$transaction(
      async (tx) => {
        // Fetch operation with moves, locations, and products
        const operation = await tx.stockOperation.findUnique({
          where: { id: operationId },
          include: {
            moves: {
              include: {
                product: true,
                sourceLocation: true,
                destLocation: true,
              },
            },
          },
        });

        if (!operation) {
          throw new AppError("Operation not found", 404);
        }

        if (operation.status === OperationStatus.DONE) {
          throw new AppError(`Operation '${operation.referenceNo}' is already validated (DONE).`, 400);
        }

        if (operation.status === OperationStatus.CANCELED) {
          throw new AppError(`Operation '${operation.referenceNo}' has been canceled and cannot be validated.`, 400);
        }

        if (operation.moves.length === 0) {
          throw new AppError("Cannot validate an operation with zero product lines.", 400);
        }

        const affectedProductIds = new Set<string>();

        for (const move of operation.moves) {
          const qty = new Decimal(move.qtyDemanded);
          if (qty.lte(0)) {
            throw new AppError(
              `Invalid demand quantity (${qty}) for product '${move.product.name}'. Must be greater than 0.`,
              400
            );
          }

          affectedProductIds.add(move.productId);

          // 1. Process Source Location
          if (move.sourceLocation.type === LocationType.INTERNAL) {
            // Find existing quant in source internal location
            const sourceQuant = await tx.stockQuant.findUnique({
              where: {
                productId_locationId: {
                  productId: move.productId,
                  locationId: move.sourceLocationId,
                },
              },
            });

            const currentQty = sourceQuant ? new Decimal(sourceQuant.quantity) : new Decimal(0);

            if (currentQty.lt(qty)) {
              throw new AppError(
                `Insufficient stock for SKU '${move.product.sku}' at '${move.sourceLocation.name}'. Available: ${currentQty}, Demanded: ${qty}`,
                400,
                {
                  sku: move.product.sku,
                  location: move.sourceLocation.name,
                  available: Number(currentQty),
                  demanded: Number(qty),
                }
              );
            }

            // Decrement source quant
            await tx.stockQuant.update({
              where: {
                productId_locationId: {
                  productId: move.productId,
                  locationId: move.sourceLocationId,
                },
              },
              data: {
                quantity: { decrement: qty },
              },
            });
          } else {
            // Virtual source (Vendor / Inventory Loss): optionally track or upsert
            await tx.stockQuant.upsert({
              where: {
                productId_locationId: {
                  productId: move.productId,
                  locationId: move.sourceLocationId,
                },
              },
              update: {
                quantity: { decrement: qty },
              },
              create: {
                productId: move.productId,
                locationId: move.sourceLocationId,
                quantity: new Decimal(0).minus(qty),
              },
            });
          }

          // 2. Process Destination Location
          // Increment or create destination quant
          await tx.stockQuant.upsert({
            where: {
              productId_locationId: {
                productId: move.productId,
                locationId: move.destLocationId,
              },
            },
            update: {
              quantity: { increment: qty },
            },
            create: {
              productId: move.productId,
              locationId: move.destLocationId,
              quantity: qty,
            },
          });

          // 3. Insert Immutable Stock Ledger entry
          await tx.stockLedger.create({
            data: {
              moveId: move.id,
              productId: move.productId,
              fromLocationId: move.sourceLocationId,
              toLocationId: move.destLocationId,
              quantity: qty,
              userId: userId || operation.responsibleUserId || null,
              referenceNo: operation.referenceNo,
              notes: `${operation.type} move executed for ${operation.referenceNo}`,
            },
          });

          // 4. Update Move status to DONE
          await tx.stockMove.update({
            where: { id: move.id },
            data: {
              status: OperationStatus.DONE,
              qtyDone: qty,
            },
          });
        }

        // 5. Update Operation status to DONE
        await tx.stockOperation.update({
          where: { id: operation.id },
          data: {
            status: OperationStatus.DONE,
            ...(userId && { responsibleUserId: userId }),
          },
        });

        // 6. Check for Low Stock Alerts across affected products
        const lowStockAlerts: TransferResult["lowStockAlerts"] = [];

        for (const prodId of affectedProductIds) {
          const product = await tx.product.findUnique({
            where: { id: prodId },
            include: {
              quants: {
                include: { location: true },
              },
            },
          });

          if (product) {
            const onHand = product.quants
              .filter((q) => q.location.type === LocationType.INTERNAL)
              .reduce((sum, q) => sum + Number(q.quantity), 0);

            const minReorder = Number(product.minReorderQty);

            if (onHand <= minReorder) {
              lowStockAlerts.push({
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                onHand,
                minReorderQty: minReorder,
              });
            }
          }
        }

        return {
          operationId: operation.id,
          referenceNo: operation.referenceNo,
          movesProcessed: operation.moves.length,
          lowStockAlerts,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );
  }
}
