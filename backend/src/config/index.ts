import dotenv from "dotenv";
import path from "path";

// Ensure .env is loaded reliably regardless of current working directory
dotenv.config();
if (typeof __dirname !== "undefined") {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/stocksense?schema=public",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim()),
  jwtSecret: process.env.JWT_SECRET || "stocksense-super-secret-jwt-key-change-in-production-32chars",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  smsProvider: (process.env.SMS_PROVIDER || "console").trim().toLowerCase().replace(/['"]/g, ""),
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  emailProvider: (process.env.EMAIL_PROVIDER || "console").trim().toLowerCase().replace(/['"]/g, ""),
  resendApiKey: (process.env.RESEND_API_KEY || "").trim().replace(/['"]/g, ""),
  emailFrom: (process.env.EMAIL_FROM || "StockSense Security <onboarding@resend.dev>").trim().replace(/^['"]|['"]$/g, ""),
};
