import { Router } from "express";
import { LocationController } from "./location.controller.js";

const router = Router();

router.get("/", LocationController.listLocations);
router.get("/:id", LocationController.getLocationById);
router.post("/", LocationController.createLocation);
router.put("/:id", LocationController.updateLocation);

export const locationRoutes = router;
