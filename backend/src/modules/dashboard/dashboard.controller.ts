import { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service.js";
import { sendSuccess } from "../../utils/response.js";

export class DashboardController {
  static async getKpiSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, categoryId } = req.query;
      const kpis = await DashboardService.getKpiSummary({
        warehouseId: warehouseId as string | undefined,
        categoryId: categoryId as string | undefined,
      });
      sendSuccess(res, kpis);
    } catch (error) {
      next(error);
    }
  }
}
