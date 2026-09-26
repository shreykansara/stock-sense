import { Router } from "express";
import { PartnerController } from "./partner.controller.js";

const router = Router();

router.get("/", PartnerController.listPartners);
router.get("/:id", PartnerController.getPartnerById);
router.post("/", PartnerController.createPartner);
router.put("/:id", PartnerController.updatePartner);

export const partnerRoutes = router;
