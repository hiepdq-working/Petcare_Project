import { apiClient, unwrap, unwrapMessage } from "../../../shared/api/client";
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyEmailRequest,
} from "@petcare/types";

export const authApi = {
  async register(input: RegisterRequest): Promise<{ message: string }> {
    const message = unwrapMessage(await apiClient.post("/auth/register", input));
    return { message };
  },

  async login(input: LoginRequest): Promise<AuthResponse> {
    return unwrap(await apiClient.post("/auth/login", input));
  },

  async loginWithGoogle(input: GoogleLoginRequest): Promise<AuthResponse> {
    return unwrap(await apiClient.post("/auth/google", input));
  },

  // Called on app boot to silently re-establish a session from the
  // httpOnly refresh cookie — rejects (no throw wrapper) if there's none.
  async refresh(): Promise<AuthResponse> {
    return unwrap(await apiClient.post("/auth/refresh"));
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async verifyEmail(input: VerifyEmailRequest): Promise<void> {
    await apiClient.post("/auth/verify-email", input);
  },

  async forgotPassword(input: ForgotPasswordRequest): Promise<void> {
    await apiClient.post("/auth/forgot-password", input);
  },

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    await apiClient.post("/auth/reset-password", input);
  },

  async getMe(): Promise<AuthUser> {
    return unwrap(await apiClient.get("/auth/me"));
  },

  async updateProfile(input: UpdateProfileRequest): Promise<AuthUser> {
    return unwrap(await apiClient.patch("/auth/me", input));
  },

  async changePassword(input: ChangePasswordRequest): Promise<void> {
    await apiClient.patch("/auth/password", input);
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return unwrap(await apiClient.post("/uploads", formData));
  },
};
