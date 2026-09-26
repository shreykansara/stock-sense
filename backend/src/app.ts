import express, { Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { authContext } from "./middleware/authContext.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerDocument } from "./docs/swagger.js";

import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { operationRoutes } from "./modules/operations/operation.routes.js";
import { adjustmentRoutes } from "./modules/adjustments/adjustment.routes.js";
import { productRoutes } from "./modules/products/product.routes.js";
import { categoryRoutes } from "./modules/categories/category.routes.js";
import { warehouseRoutes } from "./modules/warehouses/warehouse.routes.js";
import { locationRoutes } from "./modules/locations/location.routes.js";
import { partnerRoutes } from "./modules/partners/partner.routes.js";
import { ledgerRoutes } from "./modules/ledger/ledger.routes.js";

export function createApp(): Express {
  const app = express();

  // Basic Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes(origin) || config.corsOrigins.includes("*")) {
          return callback(null, true);
        }
        // In local development, permit localhost ports dynamically
        if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
          return callback(null, true);
        }
        callback(null, true);
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Authentication Context Hook (Ready for teammate's JWT middleware)
  app.use(authContext);

  // Interactive Swagger API Documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "StockSense Core Inventory Engine",
    });
  });

  // Core API Routes
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/operations", operationRoutes);
  app.use("/api/adjustments", adjustmentRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/warehouses", warehouseRoutes);
  app.use("/api/locations", locationRoutes);
  app.use("/api/partners", partnerRoutes);
  app.use("/api/ledger", ledgerRoutes);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
