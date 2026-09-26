import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { LocationType } from "@prisma/client";
import { LocationService } from "./location.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

const createLocationSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortCode: z.string().min(1, "Short code is required").max(20),
  type: z.nativeEnum(LocationType).optional(),
});

const updateLocationSchema = z.object({
  name: z.string().min(2).optional(),
  shortCode: z.string().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

export class LocationController {
  static async listLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, type, search } = req.query;
      const locations = await LocationService.listLocations({
        warehouseId: warehouseId as string | undefined,
        type: type as LocationType | undefined,
        search: search as string | undefined,
      });
      sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  }

  static async getLocationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const location = await LocationService.getLocationById(req.params.id as string);
      sendSuccess(res, location);
    } catch (error) {
      next(error);
    }
  }

  static async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createLocationSchema.parse(req.body);
      const created = await LocationService.createLocation(validated);
      sendCreated(res, created, "Location created successfully");
    } catch (error) {
      next(error);
    }
  }

  static async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateLocationSchema.parse(req.body);
      const updated = await LocationService.updateLocation(req.params.id as string, validated);
      sendSuccess(res, updated, "Location updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
