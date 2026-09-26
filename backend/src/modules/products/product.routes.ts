import { Router } from "express";
import { ProductController } from "./product.controller.js";

const router = Router();

router.get("/", ProductController.listProducts);
router.get("/:id", ProductController.getProductById);
router.post("/", ProductController.createProduct);
router.put("/:id", ProductController.updateProduct);

export const productRoutes = router;
