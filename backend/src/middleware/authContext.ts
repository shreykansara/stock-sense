import { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF" | "ADMIN";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extensible User Context Middleware
 * 
 * DESIGNED FOR COLLABORATION:
 * When the authentication teammate implements the JWT/Session auth middleware,
 * they can populate `req.user`. This middleware respects existing `req.user`
 * or reads `x-user-id` / `x-user-role` headers, falling back to a default active user
 * so core inventory routes work seamlessly during standalone testing.
 */
export const authContext = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user) {
    return next();
  }

  const userIdHeader = req.headers["x-user-id"] as string | undefined;
  const userRoleHeader = req.headers["x-user-role"] as string | undefined;
  const userNameHeader = req.headers["x-user-name"] as string | undefined;

  req.user = {
    id: userIdHeader || "00000000-0000-0000-0000-000000000001",
    email: "manager@stocksense.local",
    name: userNameHeader ? decodeURIComponent(userNameHeader) : "Shrey (Inventory Manager)",
    role: (userRoleHeader as AuthenticatedUser["role"]) || "INVENTORY_MANAGER",
  };

  next();
};
