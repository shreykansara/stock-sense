import bcrypt from "bcryptjs";
import { User, UserRole } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import {
  AuthResponse,
  SafeUser,
} from "./auth.types.js";
import {
  RegisterInput,
  LoginInput,
  GoogleLoginInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
} from "./auth.schema.js";
import { TokenService } from "./token.service.js";
import { GoogleAuthService } from "./google.service.js";
import { OtpService } from "./otp.service.js";

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    phoneVerifiedAt: user.phoneVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [local, domain] = contact.split("@");
    const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : `${local}***`;
    return `${maskedLocal}@${domain}`;
  }
  if (contact.length > 4) {
    return `${contact.slice(0, 2)}******${contact.slice(-2)}`;
  }
  return "***";
}

export class AuthService {
  /**
   * Registers a new user with email and hashed password
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new AppError("An account with this email address already exists", 409);
    }

    if (input.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: input.phone },
      });
      if (existingPhone) {
        throw new AppError("An account with this phone number already exists", 409);
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        phone: input.phone || null,
        role: input.role || UserRole.WAREHOUSE_STAFF,
      },
    });

    const token = TokenService.generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: toSafeUser(user),
      token,
    };
  }

  /**
   * Authenticates user using email and password
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.passwordHash) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = TokenService.generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: toSafeUser(user),
      token,
    };
  }

  /**
   * Authenticates or links a user via Google OAuth ID token
   */
  static async loginWithGoogle(input: GoogleLoginInput): Promise<AuthResponse> {
    const googleProfile = await GoogleAuthService.verifyIdToken(input.idToken);

    // 1. Try finding user by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleProfile.googleId },
    });

    // 2. If not found by googleId, check if account with same verified email exists
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: googleProfile.email },
      });

      if (user) {
        // Link existing account to Google identity
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleProfile.googleId },
        });
      }
    }

    // 3. If account does not exist, provision new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleProfile.email,
          name: googleProfile.name,
          googleId: googleProfile.googleId,
          role: UserRole.WAREHOUSE_STAFF,
        },
      });
    }

    const token = TokenService.generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: toSafeUser(user),
      token,
    };
  }

  /**
   * Initiates forgot-password flow by generating a hashed OTP and dispatching via SMS
   */
  static async forgotPassword(
    input: ForgotPasswordInput
  ): Promise<{ message: string; contactHint?: string }> {
    const user = await prisma.user.findFirst({
      where: input.email ? { email: input.email } : { phone: input.phone },
    });

    // Security practice: avoid leaking account existence to prevent enumeration attacks
    if (!user) {
      return {
        message: "If an account matches this identifier, a verification code has been dispatched.",
      };
    }

    const targetContact = user.phone || user.email;
    await OtpService.createAndSendResetOtp(user.id, targetContact);

    return {
      message: "If an account matches this identifier, a verification code has been dispatched.",
      contactHint: maskContact(targetContact),
    };
  }

  /**
   * Verifies the OTP and issues a short-lived reset token
   */
  static async verifyOtp(input: VerifyOtpInput): Promise<{ message: string; resetToken: string }> {
    const user = await prisma.user.findFirst({
      where: input.email ? { email: input.email } : { phone: input.phone },
    });

    if (!user) {
      throw new AppError("No account found matching the provided details", 400);
    }

    const { otpId } = await OtpService.verifyResetOtp(user.id, input.otp);

    const resetToken = TokenService.generateResetToken({
      userId: user.id,
      email: user.email,
      otpId,
      purpose: "password_reset",
    });

    return {
      message: "OTP successfully verified. You may now reset your password.",
      resetToken,
    };
  }

  /**
   * Completes the password reset process using the verified reset token
   */
  static async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const payload = TokenService.verifyResetToken(input.resetToken);

    // Verify OTP record exists and has been verified
    const otpRecord = await prisma.passwordResetOtp.findUnique({
      where: { id: payload.otpId },
    });

    if (!otpRecord || !otpRecord.verifiedAt || otpRecord.userId !== payload.userId) {
      throw new AppError("Invalid or expired password reset session", 401);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash },
    });

    // Invalidate and delete reset OTPs for this user
    await OtpService.consumeResetOtps(payload.userId);

    return {
      message: "Password has been successfully updated. You may now log in with your new password.",
    };
  }

  /**
   * Retrieves safe profile for currently authenticated user
   */
  static async getUserProfile(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return toSafeUser(user);
  }
}
