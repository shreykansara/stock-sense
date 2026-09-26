import { Router } from "express";
import { AdjustmentController } from "./adjustment.controller.js";

const router = Router();

router.post("/", AdjustmentController.adjustStock);

export const adjustmentRoutes = router;
