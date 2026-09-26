import { Router } from "express";
import { CategoryController } from "./category.controller.js";

const router = Router();

router.get("/", CategoryController.listCategories);
router.get("/:id", CategoryController.getCategoryById);
router.post("/", CategoryController.createCategory);
router.put("/:id", CategoryController.updateCategory);

export const categoryRoutes = router;
