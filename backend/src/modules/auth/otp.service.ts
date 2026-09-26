import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import { getSmsProvider } from "./sms.provider.js";

const OTP_EXPIRATION_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

export class OtpService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP string
   */
  static generateOtp(): string {
    const min = 100000;
    const max = 999999;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * Generates, hashes, stores a reset OTP for the user, and dispatches via SMS provider
   */
  static async createAndSendResetOtp(userId: string, recipientContact: string): Promise<void> {
    const rawOtp = this.generateOtp();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    // Invalidate any existing unverified OTPs for this user to ensure only latest is active
    await prisma.passwordResetOtp.updateMany({
      where: {
        userId,
        verifiedAt: null,
      },
      data: {
        expiresAt: new Date(), // expire immediately
      },
    });

    // Store new hashed OTP record
    await prisma.passwordResetOtp.create({
      data: {
        userId,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Send via SMS Provider abstraction
    const smsProvider = getSmsProvider();
    const message = `Your StockSense password reset verification code is: ${rawOtp}. Valid for ${OTP_EXPIRATION_MINUTES} minutes. Never share this code.`;
    await smsProvider.sendSms(recipientContact, message);
  }

  /**
   * Verifies the provided OTP against the latest active record for this user
   */
  static async verifyResetOtp(userId: string, rawOtp: string): Promise<{ otpId: string }> {
    const now = new Date();

    // Find the latest valid OTP record that has not yet been verified
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        verifiedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new AppError("No active password reset request found or OTP has expired", 400);
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate record for security
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { expiresAt: now },
      });
      throw new AppError("Maximum verification attempts exceeded. Please request a new OTP.", 400);
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      const remaining = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      if (remaining <= 0) {
        throw new AppError("Maximum verification attempts exceeded. Please request a new OTP.", 400);
      }

      throw new AppError(`Invalid OTP. You have ${remaining} attempt(s) remaining.`, 400);
    }

    // Mark as verified
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: now },
    });

    return { otpId: otpRecord.id };
  }

  /**
   * Consumes/cleans up verified reset OTPs after password change
   */
  static async consumeResetOtps(userId: string): Promise<void> {
    await prisma.passwordResetOtp.deleteMany({
      where: { userId },
    });
  }
}
