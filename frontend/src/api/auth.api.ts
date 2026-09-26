export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF" | "ADMIN";
  phone: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSuccessData {
  user: SafeUser;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | { field?: string; message?: string }[];
}

const API_BASE = "";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Send & store HTTP-only cookies
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    message: `Server returned ${response.status}: ${response.statusText}`,
  }));

  if (!response.ok || !json.success) {
    let errorMsg = json.message || "An unexpected error occurred";
    if (json.error) {
      if (typeof json.error === "string") {
        errorMsg = json.error;
      } else if (Array.isArray((json.error as any).validationErrors)) {
        errorMsg = (json.error as any).validationErrors
          .map((e: any) => e.message)
          .join(". ");
      }
    }
    throw new Error(errorMsg);
  }

  return json.data as T;
}

export const authApi = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<AuthSuccessData> {
    return request<AuthSuccessData>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<AuthSuccessData> {
    return request<AuthSuccessData>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async googleLogin(idToken: string): Promise<AuthSuccessData> {
    return request<AuthSuccessData>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  async forgotPassword(data: {
    email?: string;
    phone?: string;
  }): Promise<{ message: string; contactHint?: string }> {
    return request<{ message: string; contactHint?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async verifyOtp(data: {
    email?: string;
    phone?: string;
    otp: string;
  }): Promise<{ message: string; resetToken: string }> {
    return request<{ message: string; resetToken: string }>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async resetPassword(data: {
    resetToken: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<SafeUser> {
    return request<SafeUser>("/api/auth/me", {
      method: "GET",
    });
  },

  async logout(): Promise<{ loggedOut: boolean }> {
    return request<{ loggedOut: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  },

  async getGoogleClientId(): Promise<{ clientId: string }> {
    return request<{ clientId: string }>("/api/auth/google/client-id", {
      method: "GET",
    });
  },
};
