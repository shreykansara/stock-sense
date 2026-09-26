import { Router } from "express";
import { WarehouseController } from "./warehouse.controller.js";

const router = Router();

router.get("/", WarehouseController.listWarehouses);
router.get("/:id", WarehouseController.getWarehouseById);
router.post("/", WarehouseController.createWarehouse);
router.put("/:id", WarehouseController.updateWarehouse);

export const warehouseRoutes = router;
