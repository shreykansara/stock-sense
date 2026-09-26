import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CategoryService } from "./category.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
});

export class CategoryController {
  static async listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.listCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.getCategoryById(req.params.id as string);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = categorySchema.parse(req.body);
      const created = await CategoryService.createCategory(validated);
      sendCreated(res, created, "Category created successfully");
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = categorySchema.partial().parse(req.body);
      const updated = await CategoryService.updateCategory(req.params.id as string, validated);
      sendSuccess(res, updated, "Category updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
