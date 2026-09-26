import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ProductService } from "./product.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

const createProductSchema = z.object({
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  categoryId: z.string().uuid("Valid Category UUID is required"),
  uom: z.string().optional(),
  perUnitCost: z.number().min(0).optional(),
  minReorderQty: z.number().min(0).optional(),
  initialStock: z.number().min(0).optional(),
  initialLocationId: z.string().uuid().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  categoryId: z.string().uuid().optional(),
  uom: z.string().optional(),
  perUnitCost: z.number().min(0).optional(),
  minReorderQty: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export class ProductController {
  static async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, search, lowStockOnly } = req.query;
      const products = await ProductService.listProducts({
        categoryId: categoryId as string | undefined,
        search: search as string | undefined,
        lowStockOnly: lowStockOnly === "true",
      });
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getProductById(req.params.id as string);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createProductSchema.parse(req.body);
      const created = await ProductService.createProduct(validated);
      sendCreated(res, created, "Product created successfully");
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateProductSchema.parse(req.body);
      const updated = await ProductService.updateProduct(req.params.id as string, validated);
      sendSuccess(res, updated, "Product updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
