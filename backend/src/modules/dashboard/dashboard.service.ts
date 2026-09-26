import { LocationType, OperationStatus, OperationType } from "@prisma/client";
import { prisma } from "../../db/client.js";

export interface DashboardFilters {
  warehouseId?: string;
  categoryId?: string;
}

export class DashboardService {
  static async getKpiSummary(filters?: DashboardFilters) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const warehouseFilter = filters?.warehouseId ? { warehouseId: filters.warehouseId } : {};
    const categoryFilter = filters?.categoryId ? { categoryId: filters.categoryId } : {};

    // 1. Total Products in Stock
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...categoryFilter,
      },
      include: {
        quants: {
          where: {
            location: {
              type: LocationType.INTERNAL,
              ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
            },
          },
        },
      },
    });

    let totalProductsInStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const prod of products) {
      const onHand = prod.quants.reduce((sum, q) => sum + Number(q.quantity), 0);
      if (onHand > 0) {
        totalProductsInStock++;
      }
      if (onHand <= 0) {
        outOfStockCount++;
      } else if (onHand <= Number(prod.minReorderQty)) {
        lowStockCount++;
      }
    }

    // 2. Receipts Overview (Pending, Late, Scheduled)
    const pendingReceipts = await prisma.stockOperation.findMany({
      where: {
        type: OperationType.RECEIPT,
        status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
        ...warehouseFilter,
      },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
      },
    });

    const receiptsLate = pendingReceipts.filter(
      (op) => new Date(op.scheduledDate) < today
    ).length;
    const receiptsToReceive = pendingReceipts.length;

    // 3. Deliveries Overview (Pending, Late, Waiting, Scheduled)
    const pendingDeliveries = await prisma.stockOperation.findMany({
      where: {
        type: OperationType.DELIVERY,
        status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
        ...warehouseFilter,
      },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
      },
    });

    const deliveriesLate = pendingDeliveries.filter(
      (op) => new Date(op.scheduledDate) < today
    ).length;
    const deliveriesWaiting = pendingDeliveries.filter(
      (op) => op.status === OperationStatus.WAITING
    ).length;
    const deliveriesToDeliver = pendingDeliveries.length;

    // 4. Internal Transfers Scheduled
    const internalTransfersScheduled = await prisma.stockOperation.count({
      where: {
        type: OperationType.INTERNAL,
        status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
        ...warehouseFilter,
      },
    });

    // 5. Recent Activity Feed (Latest operations & ledger entries)
    const recentOperations = await prisma.stockOperation.findMany({
      where: warehouseFilter,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: { select: { name: true, shortCode: true } },
        partner: { select: { name: true } },
      },
    });

    return {
      kpiCards: {
        totalProductsInStock,
        totalCatalogItems: products.length,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        receipts: {
          toReceive: receiptsToReceive,
          late: receiptsLate,
          totalOperations: pendingReceipts.length,
        },
        deliveries: {
          toDeliver: deliveriesToDeliver,
          late: deliveriesLate,
          waiting: deliveriesWaiting,
          totalOperations: pendingDeliveries.length,
        },
        internalTransfers: {
          scheduled: internalTransfersScheduled,
        },
      },
      recentActivity: recentOperations,
    };
  }
}
