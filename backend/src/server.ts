import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { prisma } from "./db/client.js";
import { LocationService } from "./modules/locations/location.service.js";

const app = createApp();

async function startServer() {
  try {
    // Attempt to ensure virtual locations if database is reachable
    try {
      await prisma.$connect();
      await LocationService.ensureVirtualLocations();
      console.log("[Setup] Database connected & virtual locations verified (Vendors, Customers, Inventory Loss, Production)");
    } catch {
      console.log("ℹ️  Database offline: PostgreSQL not yet reachable at localhost:5432.");
      console.log("   (Start Postgres via 'docker compose up -d' or set DATABASE_URL in backend/.env)");
    }

    app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 StockSense Core Inventory Engine Server Running`);
      console.log(`📡 URL: http://localhost:${config.port}/api`);
      console.log(`📖 Interactive Swagger Docs: http://localhost:${config.port}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
