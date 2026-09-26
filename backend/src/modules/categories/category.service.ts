import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";

export class CategoryService {
  static async listCategories() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  static async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    return category;
  }

  static async createCategory(data: { name: string; description?: string }) {
    const cleanName = data.name.trim();
    const existing = await prisma.category.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      throw new AppError(`Category '${cleanName}' already exists`, 409);
    }

    return prisma.category.create({
      data: {
        name: cleanName,
        description: data.description?.trim(),
      },
    });
  }

  static async updateCategory(id: string, data: { name?: string; description?: string }) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Category not found", 404);
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
      },
    });
  }
}
