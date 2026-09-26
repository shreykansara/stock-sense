import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AdjustmentService } from "./adjustment.service.js";
import { sendSuccess } from "../../utils/response.js";

const adjustStockSchema = z.object({
  productId: z.string().uuid("Valid product UUID is required"),
  locationId: z.string().uuid("Valid location UUID is required"),
  countedQty: z.number().min(0, "Counted quantity cannot be negative"),
  reason: z.string().optional(),
});

export class AdjustmentController {
  static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = adjustStockSchema.parse(req.body);
      const userId = req.user?.id;
      const result = await AdjustmentService.adjustStock({
        ...validated,
        userId,
      });
      sendSuccess(res, result, "Stock adjusted and ledger reconciled successfully");
    } catch (error) {
      next(error);
    }
  }
}
