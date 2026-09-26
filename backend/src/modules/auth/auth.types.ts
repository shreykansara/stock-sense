import { UserRole } from "@prisma/client";

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export interface PasswordResetTokenPayload {
  userId: string;
  email: string;
  otpId: string;
  purpose: "password_reset";
}
