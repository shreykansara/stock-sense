import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { OperationStatus, OperationType } from "@prisma/client";
import { OperationService } from "./operation.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

const moveItemSchema = z.object({
  productId: z.string().uuid("Product ID must be a valid UUID"),
  qtyDemanded: z.number().positive("Demanded quantity must be greater than 0"),
  sourceLocationId: z.string().uuid().optional(),
  destLocationId: z.string().uuid().optional(),
});

const createOperationSchema = z.object({
  type: z.nativeEnum(OperationType),
  warehouseId: z.string().uuid("Warehouse ID must be a valid UUID"),
  partnerId: z.string().uuid().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
  moves: z.array(moveItemSchema).min(1, "At least one product line is required"),
});

export class OperationController {
  static async listOperations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, status, warehouseId, search } = req.query;
      const operations = await OperationService.listOperations({
        type: type as OperationType | undefined,
        status: status as OperationStatus | undefined,
        warehouseId: warehouseId as string | undefined,
        search: search as string | undefined,
      });
      sendSuccess(res, operations);
    } catch (error) {
      next(error);
    }
  }

  static async getOperationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operation = await OperationService.getOperationById(req.params.id as string);
      sendSuccess(res, operation);
    } catch (error) {
      next(error);
    }
  }

  static async createOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createOperationSchema.parse(req.body);
      const responsibleUserId = req.user?.id;
      const operation = await OperationService.createOperation({
        ...validated,
        responsibleUserId,
      });
      sendCreated(res, operation, "Stock Operation created successfully");
    } catch (error) {
      next(error);
    }
  }

  static async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OperationService.checkAvailability(req.params.id as string);
      sendSuccess(res, result, `Availability checked: Status is now ${result.status}`);
    } catch (error) {
      next(error);
    }
  }

  static async validateOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await OperationService.validateOperation(req.params.id as string, userId);
      sendSuccess(res, result, "Operation validated and stock balances updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async cancelOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OperationService.cancelOperation(req.params.id as string);
      sendSuccess(res, result, "Operation canceled successfully");
    } catch (error) {
      next(error);
    }
  }
}
