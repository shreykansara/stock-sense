import { OperationType, Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";

const OPERATION_CODE_MAP: Record<OperationType, string> = {
  RECEIPT: "IN",
  DELIVERY: "OUT",
  INTERNAL: "INT",
  ADJUSTMENT: "ADJ",
};

export class SequenceService {
  /**
   * Generates the next sequential reference number for a given warehouse and operation type.
   * e.g., WH/IN/0001, WH/OUT/0002
   */
  static async getNextReference(
    warehouseCode: string,
    operationType: OperationType,
    tx?: Prisma.TransactionClient
  ): Promise<string> {
    const client = tx || prisma;
    const cleanWarehouseCode = warehouseCode.trim().toUpperCase();
    const opCode = OPERATION_CODE_MAP[operationType] || "OP";

    // Atomically find and increment sequence
    const sequence = await client.sequence.upsert({
      where: {
        warehouseCode_operationType: {
          warehouseCode: cleanWarehouseCode,
          operationType,
        },
      },
      update: {
        nextNumber: { increment: 1 },
      },
      create: {
        warehouseCode: cleanWarehouseCode,
        operationType,
        nextNumber: 2, // First one generated will be 1
      },
    });

    // If it was an update, current number was sequence.nextNumber - 1; if create, it's 1
    // To be strictly consistent: sequence.nextNumber holds what the next generator will take.
    // Let's format current number with 4-digit padding: 0001, 0002...
    const currentNumber = sequence.nextNumber - 1;
    const formattedNumber = String(currentNumber).padStart(4, "0");

    return `${cleanWarehouseCode}/${opCode}/${formattedNumber}`;
  }
}
