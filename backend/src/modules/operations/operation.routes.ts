import { Router } from "express";
import { OperationController } from "./operation.controller.js";

const router = Router();

router.get("/", OperationController.listOperations);
router.get("/:id", OperationController.getOperationById);
router.post("/", OperationController.createOperation);
router.post("/:id/check-availability", OperationController.checkAvailability);
router.post("/:id/validate", OperationController.validateOperation);
router.post("/:id/cancel", OperationController.cancelOperation);

export const operationRoutes = router;
