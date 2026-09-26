import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { TokenService } from "../src/modules/auth/token.service.js";
import { ConsoleEmailProvider, setEmailProvider } from "../src/modules/auth/email.provider.js";
import { prisma } from "../src/db/client.js";
import bcrypt from "bcryptjs";

describe("Live End-to-End Authentication & Database Integration Test", () => {
  const testEmail = "test.pilot@stocksense.local";
  const initialPassword = "StrongPassword123!";
  const newPassword = "NewStrongPassword456!";
  let createdUserId = "";

  beforeAll(() => {
    setEmailProvider(new ConsoleEmailProvider());
  });

  afterAll(async () => {
    setEmailProvider(null);
    if (createdUserId) {
      await prisma.passwordResetOtp.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
  });

  it("completes full Signup flow: persists user with bcrypt hash & issues JWT", async () => {
    // Clean if residual
    await prisma.passwordResetOtp.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });

    const signupRes = await AuthService.register({
      name: "Pilot Tester",
      email: testEmail,
      password: initialPassword,
      phone: "+15559998888",
    });

    createdUserId = signupRes.user.id;
    expect(signupRes.user.id).toBeDefined();
    expect(signupRes.user.email).toBe(testEmail);
    expect(signupRes.user.name).toBe("Pilot Tester");
    expect((signupRes.user as any).passwordHash).toBeUndefined();
    expect(typeof signupRes.token).toBe("string");

    // Verify database record
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.passwordHash).toBeDefined();
    expect(dbUser?.passwordHash?.startsWith("$2")).toBe(true);
    expect(dbUser?.passwordHash).not.toBe(initialPassword);
  });

  it("completes full Login flow with valid credentials and rejects invalid passwords", async () => {
    const loginRes = await AuthService.login({
      email: testEmail,
      password: initialPassword,
    });

    expect(loginRes.user.email).toBe(testEmail);
    expect(typeof loginRes.token).toBe("string");

    // Invalid password
    await expect(
      AuthService.login({
        email: testEmail,
        password: "IncorrectPassword123!",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("verifies JWT session and retrieves user profile (simulating /api/auth/me)", async () => {
    const loginRes = await AuthService.login({
      email: testEmail,
      password: initialPassword,
    });

    const payload = TokenService.verifyToken(loginRes.token);
    expect(payload.userId).toBe(createdUserId);
    expect(payload.email).toBe(testEmail);

    const profile = await AuthService.getUserProfile(payload.userId);
    expect(profile.id).toBe(createdUserId);
    expect(profile.email).toBe(testEmail);
    expect(profile.name).toBe("Pilot Tester");
  });

  it("completes Forgot Password -> OTP -> Reset Password -> Login with new credentials", async () => {
    // 1. Request OTP
    const forgotRes = await AuthService.forgotPassword({ email: testEmail });
    expect(forgotRes.message).toBeDefined();

    // 2. Fetch OTP record from DB to verify hash storage
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: { userId: createdUserId, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });
    expect(otpRecord).not.toBeNull();
    expect(otpRecord?.otpHash.startsWith("$2")).toBe(true);

    // 3. Set a known code in test to verify verifyOtp & resetPassword logic
    const testCode = "654321";
    const hashedCode = await bcrypt.hash(testCode, 10);
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord!.id },
      data: { otpHash: hashedCode },
    });

    // 4. Invalid OTP code rejected
    await expect(
      AuthService.verifyOtp({
        email: testEmail,
        otp: "000000",
      })
    ).rejects.toThrow();

    // 5. Valid OTP code accepted
    const verifyRes = await AuthService.verifyOtp({
      email: testEmail,
      otp: testCode,
    });
    expect(verifyRes.resetToken).toBeDefined();

    // 6. Reset password with verified token
    const resetRes = await AuthService.resetPassword({
      resetToken: verifyRes.resetToken,
      newPassword,
    });
    expect(resetRes.message).toBeDefined();

    // 7. Login with newly reset password succeeds
    const newLoginRes = await AuthService.login({
      email: testEmail,
      password: newPassword,
    });
    expect(newLoginRes.user.id).toBe(createdUserId);

    // 8. Old password fails
    await expect(
      AuthService.login({
        email: testEmail,
        password: initialPassword,
      })
    ).rejects.toThrow("Invalid email or password");
  });
});
