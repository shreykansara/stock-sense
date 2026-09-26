import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import { getSmsProvider } from "./sms.provider.js";
import { getEmailProvider } from "./email.provider.js";

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
   * Generates, hashes, stores a reset OTP for the user, and dispatches via SMS or Email provider
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

    // Dispatch via Email or SMS Provider abstraction depending on contact type
    if (recipientContact.includes("@")) {
      const emailProvider = getEmailProvider();
      await emailProvider.sendEmail({
        to: recipientContact,
        subject: `Your StockSense Verification Code: ${rawOtp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #38bdf8; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">StockSense</h2>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Security &amp; Account Verification</p>
            </div>
            <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0 0 16px 0; color: #e2e8f0; font-size: 14px;">Use the following verification code to reset your password:</p>
              <div style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; background: #030712; padding: 12px 24px; border-radius: 10px; border: 1px solid #334155; font-family: monospace;">
                ${rawOtp}
              </div>
              <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 12px;">This code will expire in ${OTP_EXPIRATION_MINUTES} minutes. If you did not request this, please disregard this email.</p>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 11px; text-align: center;">Never share this verification code with anyone. StockSense staff will never ask for your code.</p>
          </div>
        `,
        text: `Your StockSense password reset verification code is: ${rawOtp}. Valid for ${OTP_EXPIRATION_MINUTES} minutes. Never share this code.`,
      });
    } else {
      const smsProvider = getSmsProvider();
      const message = `Your StockSense password reset verification code is: ${rawOtp}. Valid for ${OTP_EXPIRATION_MINUTES} minutes. Never share this code.`;
      await smsProvider.sendSms(recipientContact, message);
    }
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
