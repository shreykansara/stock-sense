import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PartnerType } from "@prisma/client";
import { PartnerService } from "./partner.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

const partnerSchema = z.object({
  name: z.string().min(2, "Partner name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.nativeEnum(PartnerType).optional(),
});

export class PartnerController {
  static async listPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as PartnerType | undefined;
      const partners = await PartnerService.listPartners(type);
      sendSuccess(res, partners);
    } catch (error) {
      next(error);
    }
  }

  static async getPartnerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partner = await PartnerService.getPartnerById(req.params.id as string);
      sendSuccess(res, partner);
    } catch (error) {
      next(error);
    }
  }

  static async createPartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = partnerSchema.parse(req.body);
      const created = await PartnerService.createPartner({
        ...validated,
        email: validated.email || undefined,
      });
      sendCreated(res, created, "Partner created successfully");
    } catch (error) {
      next(error);
    }
  }

  static async updatePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = partnerSchema.partial().parse(req.body);
      const updated = await PartnerService.updatePartner(req.params.id as string, {
        ...validated,
        email: validated.email || undefined,
      });
      sendSuccess(res, updated, "Partner updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
