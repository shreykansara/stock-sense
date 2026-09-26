import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { WarehouseService } from "./warehouse.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

const createWarehouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortCode: z.string().min(1, "Short code is required").max(10),
  address: z.string().optional(),
});

const updateWarehouseSchema = z.object({
  name: z.string().min(2).optional(),
  shortCode: z.string().min(1).max(10).optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export class WarehouseController {
  static async listWarehouses(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouses = await WarehouseService.listWarehouses();
      sendSuccess(res, warehouses);
    } catch (error) {
      next(error);
    }
  }

  static async getWarehouseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await WarehouseService.getWarehouseById(req.params.id as string);
      sendSuccess(res, warehouse);
    } catch (error) {
      next(error);
    }
  }

  static async createWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createWarehouseSchema.parse(req.body);
      const created = await WarehouseService.createWarehouse(validated);
      sendCreated(res, created, "Warehouse created successfully with default Stock location");
    } catch (error) {
      next(error);
    }
  }

  static async updateWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateWarehouseSchema.parse(req.body);
      const updated = await WarehouseService.updateWarehouse(req.params.id as string, validated);
      sendSuccess(res, updated, "Warehouse updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
