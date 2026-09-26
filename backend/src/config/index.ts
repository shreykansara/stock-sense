import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/stocksense?schema=public",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim()),
};
