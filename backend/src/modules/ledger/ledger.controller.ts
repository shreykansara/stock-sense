import { Request, Response, NextFunction } from "express";
import { LedgerService } from "./ledger.service.js";
import { sendSuccess } from "../../utils/response.js";

export class LedgerController {
  static async listLedgerEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, referenceNo, search, dateFrom, dateTo, limit, offset } = req.query;

      const result = await LedgerService.listLedgerEntries({
        productId: productId as string | undefined,
        referenceNo: referenceNo as string | undefined,
        search: search as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      sendSuccess(res, result.data, undefined, 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      });
    } catch (error) {
      next(error);
    }
  }
}
