import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { sendError } from "../utils/response.js";

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    sendError(res, "Validation Error", 422, { validationErrors: formattedErrors });
    return;
  }

  // Handle Custom Application Errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.details as Record<string, unknown> | undefined);
    return;
  }

  // Handle Prisma Known Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || ["field"];
      sendError(res, `A record with this ${target.join(", ")} already exists.`, 409, {
        code: err.code,
        target,
      });
      return;
    }

    if (err.code === "P2025") {
      sendError(res, "Requested record was not found.", 404, { code: err.code });
      return;
    }

    sendError(res, `Database error: ${err.message}`, 400, { code: err.code });
    return;
  }

  // Handle Prisma Initialization / Connection Errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    sendError(
      res,
      "Database connection error: Unable to reach PostgreSQL at localhost:5432. Please ensure the database is running (e.g., run 'docker compose up -d').",
      503,
      { code: err.errorCode }
    );
    return;
  }

  // Handle standard generic errors
  if (err instanceof Error) {
    console.error("[Unhandled Error]", err.stack || err.message);
    sendError(
      res,
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
      500
    );
    return;
  }

  console.error("[Unknown Error]", err);
  sendError(res, "An unexpected error occurred", 500);
};
