import { Router } from "express";
import { LedgerController } from "./ledger.controller.js";

const router = Router();

router.get("/", LedgerController.listLedgerEntries);

export const ledgerRoutes = router;
