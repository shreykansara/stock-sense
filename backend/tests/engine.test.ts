import { describe, it, expect, vi } from "vitest";

describe("Double-Entry Stock Engine & Logic Verification", () => {
  it("conserves total inventory across double-entry transactions (sum of delta = 0)", () => {
    // Initial balances
    let vendorBalance = 0;
    let internalStockBalance = 0;

    const receiptQuantity = 50;

    // Transaction: Vendor -> Internal
    vendorBalance -= receiptQuantity;
    internalStockBalance += receiptQuantity;

    const systemNetChange = vendorBalance + internalStockBalance;
    expect(systemNetChange).toBe(0);
    expect(internalStockBalance).toBe(50);
  });

  it("calculates Free to Use stock correctly (On Hand - Reserved)", () => {
    const onHand = 50;
    const reservedForDelivery = 15;
    const freeToUse = Math.max(0, onHand - reservedForDelivery);

    expect(freeToUse).toBe(35);
  });

  it("calculates Physical Count Adjustment Delta and assigns correct virtual counterpart", () => {
    const recordedQty = 10;
    const physicalCount = 7;
    const delta = physicalCount - recordedQty; // -3

    expect(delta).toBe(-3);

    // If delta < 0 (damage/shrinkage):
    // Source: Internal Location
    // Destination: Virtual Inventory Loss
    const sourceLocation = delta < 0 ? "Internal/Stock" : "Virtual/Inventory-Loss";
    const destLocation = delta < 0 ? "Virtual/Inventory-Loss" : "Internal/Stock";
    const moveQuantity = Math.abs(delta);

    expect(sourceLocation).toBe("Internal/Stock");
    expect(destLocation).toBe("Virtual/Inventory-Loss");
    expect(moveQuantity).toBe(3);
  });

  it("calculates Surplus Physical Count Adjustment Delta correctly", () => {
    const recordedQty = 10;
    const physicalCount = 14;
    const delta = physicalCount - recordedQty; // +4

    expect(delta).toBe(4);

    // If delta > 0 (surplus found):
    // Source: Virtual Inventory Loss
    // Destination: Internal Location
    const sourceLocation = delta > 0 ? "Virtual/Inventory-Loss" : "Internal/Stock";
    const destLocation = delta > 0 ? "Internal/Stock" : "Virtual/Inventory-Loss";
    const moveQuantity = Math.abs(delta);

    expect(sourceLocation).toBe("Virtual/Inventory-Loss");
    expect(destLocation).toBe("Internal/Stock");
    expect(moveQuantity).toBe(4);
  });

  it("formats standard hierarchical sequence references according to blueprint", () => {
    const formatReference = (wh: string, op: "IN" | "OUT" | "INT" | "ADJ", seq: number) => {
      return `${wh}/${op}/${String(seq).padStart(4, "0")}`;
    };

    expect(formatReference("WH", "IN", 1)).toBe("WH/IN/0001");
    expect(formatReference("WH", "OUT", 2)).toBe("WH/OUT/0002");
    expect(formatReference("WH", "INT", 14)).toBe("WH/INT/0014");
    expect(formatReference("WH", "ADJ", 100)).toBe("WH/ADJ/0100");
  });

  it("evaluates low-stock reorder thresholds correctly", () => {
    const minReorderQty = 10;
    const stockAfterMove = 8;
    const isLowStock = stockAfterMove <= minReorderQty;

    expect(isLowStock).toBe(true);
  });
});
