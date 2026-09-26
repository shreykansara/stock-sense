import { OAuth2Client } from "google-auth-library";
import { config } from "../../config/index.js";
import { AppError } from "../../middleware/errorHandler.js";

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
}

export class GoogleAuthService {
  private static getClient(): OAuth2Client {
    return new OAuth2Client(config.googleClientId);
  }

  /**
   * Verifies the Google ID token and returns trusted profile information.
   * Never trusts client-provided identity without server-side verification.
   */
  static async verifyIdToken(idToken: string): Promise<VerifiedGoogleUser> {
    if (!idToken) {
      throw new AppError("Google ID token is required", 400);
    }

    try {
      const client = this.getClient();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.googleClientId || undefined,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError("Failed to extract profile from Google ID token", 401);
      }

      if (!payload.sub || !payload.email) {
        throw new AppError("Google account does not contain a verified ID or email", 401);
      }

      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split("@")[0] || "Google User",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Google OAuth] Verification failed:", message);
      throw new AppError(
        "Google authentication failed: unable to verify ID token. Ensure valid Google credentials are configured.",
        401
      );
    }
  }
}
