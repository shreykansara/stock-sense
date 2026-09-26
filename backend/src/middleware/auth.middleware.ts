import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { TokenService } from "../modules/auth/token.service.js";
import { sendError } from "../utils/response.js";
import { AuthenticatedUser } from "./authContext.js";

/**
 * Extracts JWT token from Authorization header or HTTP-only cookies
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  if (req.cookies && typeof req.cookies.token === "string") {
    return req.cookies.token;
  }

  return null;
}

/**
 * Strict authentication middleware.
 * Requires a valid JWT token. Rejects unauthenticated requests with 401.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    sendError(res, "Authentication required. Please provide a valid Bearer token.", 401);
    return;
  }

  try {
    const payload = TokenService.verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name || payload.email,
      role: payload.role as AuthenticatedUser["role"],
    };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid or expired token";
    sendError(res, message, 401);
  }
};

/**
 * Optional authentication middleware.
 * Reads token if present, sets req.user, but does NOT reject if absent.
 * Used globally so authenticated users are recognized without breaking public/unprotected endpoints.
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const payload = TokenService.verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name || payload.email,
      role: payload.role as AuthenticatedUser["role"],
    };
  } catch {
    // If optional token is invalid or expired, proceed without attaching req.user
  }

  next();
};

/**
 * Role-Based Access Control (RBAC) middleware factory
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, "Authentication required", 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      sendError(
        res,
        `Forbidden: role '${req.user.role}' is not authorized to access this resource`,
        403
      );
      return;
    }

    next();
  };
};
