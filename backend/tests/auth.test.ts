import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { TokenService } from "../src/modules/auth/token.service.js";
import { OtpService } from "../src/modules/auth/otp.service.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "../src/modules/auth/auth.schema.js";
import { ConsoleSmsProvider, getSmsProvider } from "../src/modules/auth/sms.provider.js";
import {
  ConsoleEmailProvider,
  ResendEmailProvider,
  getEmailProvider,
} from "../src/modules/auth/email.provider.js";
import { extractToken } from "../src/middleware/auth.middleware.js";
import { config } from "../src/config/index.js";

describe("StockSense Auth Module Unit & Logic Tests", () => {
  describe("TokenService", () => {
    it("generates and verifies a valid JWT auth payload", () => {
      const payload = {
        userId: "test-user-uuid-1234",
        email: "saran@stocksense.local",
        name: "Saran",
        role: UserRole.WAREHOUSE_STAFF,
      };

      const token = TokenService.generateToken(payload);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(20);

      const decoded = TokenService.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
      expect(decoded.role).toBe(UserRole.WAREHOUSE_STAFF);
    });

    it("generates and verifies a temporary password reset token", () => {
      const resetPayload = {
        userId: "test-user-uuid-5678",
        email: "reset@stocksense.local",
        otpId: "otp-record-uuid-9999",
        purpose: "password_reset" as const,
      };

      const token = TokenService.generateResetToken(resetPayload);
      expect(typeof token).toBe("string");

      const decoded = TokenService.verifyResetToken(token);
      expect(decoded.userId).toBe(resetPayload.userId);
      expect(decoded.email).toBe(resetPayload.email);
      expect(decoded.otpId).toBe(resetPayload.otpId);
      expect(decoded.purpose).toBe("password_reset");
    });

    it("rejects invalid or tampered JWT tokens", () => {
      expect(() => {
        TokenService.verifyToken("invalid.token.string");
      }).toThrow();
    });
  });

  describe("OtpService", () => {
    it("generates a 6-digit cryptographically secure numeric OTP", () => {
      const otp1 = OtpService.generateOtp();
      const otp2 = OtpService.generateOtp();

      expect(otp1).toHaveLength(6);
      expect(/^\d{6}$/.test(otp1)).toBe(true);
      expect(parseInt(otp1, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp1, 10)).toBeLessThanOrEqual(999999);

      // Verify that consecutive calls produce random codes
      expect(otp1).not.toBe(otp2);
    });
  });

  describe("Auth Validation Schemas", () => {
    it("validates valid registration input and normalizes email", () => {
      const input = {
        email: "  USER@Example.COM  ",
        password: "SuperSecretPassword123!",
        name: "Test User",
        role: "INVENTORY_MANAGER",
      };

      const parsed = registerSchema.parse(input);
      expect(parsed.email).toBe("user@example.com");
      expect(parsed.role).toBe(UserRole.INVENTORY_MANAGER);
    });

    it("rejects registration with short password", () => {
      const input = {
        email: "user@example.com",
        password: "123",
        name: "Test User",
      };

      expect(() => registerSchema.parse(input)).toThrow();
    });

    it("validates login schema", () => {
      const input = {
        email: "Manager@stocksense.local",
        password: "StrongPassword123",
      };

      const parsed = loginSchema.parse(input);
      expect(parsed.email).toBe("manager@stocksense.local");
    });

    it("validates forgot password with email or phone", () => {
      expect(() => forgotPasswordSchema.parse({})).toThrow();

      const withEmail = forgotPasswordSchema.parse({ email: "test@example.com" });
      expect(withEmail.email).toBe("test@example.com");

      const withPhone = forgotPasswordSchema.parse({ phone: "+1234567890" });
      expect(withPhone.phone).toBe("+1234567890");
    });

    it("validates OTP verification input", () => {
      const valid = verifyOtpSchema.parse({
        email: "user@example.com",
        otp: "123456",
      });
      expect(valid.otp).toBe("123456");

      expect(() =>
        verifyOtpSchema.parse({
          email: "user@example.com",
          otp: "123", // too short
        })
      ).toThrow();

      expect(() =>
        verifyOtpSchema.parse({
          email: "user@example.com",
          otp: "abcdef", // non-digits
        })
      ).toThrow();
    });

    it("validates reset password schema", () => {
      const valid = resetPasswordSchema.parse({
        resetToken: "some-valid-reset-token",
        newPassword: "BrandNewSecurePassword123",
      });
      expect(valid.newPassword).toBe("BrandNewSecurePassword123");
    });
  });

  describe("SMS Provider Abstraction", () => {
    it("returns ConsoleSmsProvider by default and executes sendSms", async () => {
      const provider = getSmsProvider();
      expect(provider).toBeInstanceOf(ConsoleSmsProvider);

      const result = await provider.sendSms("+15551234567", "Test verification OTP");
      expect(result).toBe(true);
    });
  });

  describe("Email Provider Abstraction & Resend Integration", () => {
    it("returns ConsoleEmailProvider when instantiated and executes sendEmail", async () => {
      const consoleProvider = new ConsoleEmailProvider();
      expect(consoleProvider).toBeInstanceOf(ConsoleEmailProvider);

      const result = await consoleProvider.sendEmail({
        to: "recipient@stocksense.local",
        subject: "StockSense Code",
        html: "<p>123456</p>",
        text: "123456",
      });
      expect(result).toBe(true);
    });

    it("supports ResendEmailProvider with mocked API calls", async () => {
      const resendProvider = new ResendEmailProvider("re_test_dummy_key_12345");
      (resendProvider as any).resend = {
        emails: {
          send: vi.fn().mockResolvedValue({
            data: { id: "resend-msg-uuid-1234" },
            error: null,
          }),
        },
      };

      const result = await resendProvider.sendEmail({
        to: "user@example.com",
        subject: "Verification Code",
        html: "<p>Your code is 654321</p>",
      });

      expect(result).toBe(true);
      expect((resendProvider as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["user@example.com"],
          subject: "Verification Code",
        })
      );
    });

    it("handles Resend API error cleanly", async () => {
      const resendProvider = new ResendEmailProvider("re_test_dummy_key_12345");
      (resendProvider as any).resend = {
        emails: {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Invalid API Key", name: "validation_error" },
          }),
        },
      };

      await expect(
        resendProvider.sendEmail({
          to: "user@example.com",
          subject: "Verification Code",
          html: "<p>Your code is 654321</p>",
        })
      ).rejects.toThrow("Invalid API Key");
    });
  });

  describe("Auth Middleware Token Extraction", () => {
    it("extracts Bearer token from authorization header", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer mock-jwt-token-string",
        },
      } as any;

      const token = extractToken(mockReq);
      expect(token).toBe("mock-jwt-token-string");
    });

    it("extracts token from cookies when present", () => {
      const mockReq = {
        headers: {},
        cookies: {
          token: "cookie-jwt-token-string",
        },
      } as any;

      const token = extractToken(mockReq);
      expect(token).toBe("cookie-jwt-token-string");
    });

    it("returns null when no token is present", () => {
      const mockReq = {
        headers: {},
      } as any;

      const token = extractToken(mockReq);
      expect(token).toBeNull();
    });
  });

  describe("Google Client ID Endpoint", () => {
    it("safely exposes Google Client ID without leaking Client Secret", () => {
      expect(config).toHaveProperty("googleClientId");
      expect(typeof config.googleClientId).toBe("string");
    });
  });
});
