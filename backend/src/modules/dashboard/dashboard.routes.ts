import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";

const router = Router();

router.get("/summary", DashboardController.getKpiSummary);

export const dashboardRoutes = router;
