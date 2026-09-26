import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";
import { AppError } from "../../middleware/errorHandler.js";
import { AuthTokenPayload, PasswordResetTokenPayload } from "./auth.types.js";

export class TokenService {
  /**
   * Generates a signed JWT session/access token containing minimal essential claims
   */
  static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }

  /**
   * Verifies and decodes a signed JWT session/access token
   */
  static verifyToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
      if (!decoded.userId || !decoded.email || !decoded.role) {
        throw new AppError("Malformed authentication token", 401);
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Authentication token has expired. Please log in again.", 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid authentication token", 401);
      }
      throw error;
    }
  }

  /**
   * Generates a temporary, single-purpose password reset token after OTP verification
   */
  static generateResetToken(payload: PasswordResetTokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: "15m",
    });
  }

  /**
   * Verifies and decodes a password reset token
   */
  static verifyResetToken(token: string): PasswordResetTokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as PasswordResetTokenPayload;
      if (!decoded.userId || decoded.purpose !== "password_reset") {
        throw new AppError("Invalid or expired password reset session", 401);
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Password reset session has expired. Please request a new OTP.", 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid password reset token", 401);
      }
      throw error;
    }
  }
}
