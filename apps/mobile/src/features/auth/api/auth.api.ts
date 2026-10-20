import type {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from "@petcare/types";
import { apiClient, unwrap, unwrapMessage } from "../../../shared/api/client";
import { getRefreshToken } from "../../../shared/api/token-store";

export const authApi = {
  async register(input: RegisterRequest): Promise<{ message: string }> {
    return { message: unwrapMessage(await apiClient.post("/auth/register", input)) };
  },
  async login(input: LoginRequest): Promise<AuthResponse> {
    return unwrap(await apiClient.post("/auth/login", input));
  },
  async logout(): Promise<void> {
    const refreshToken = await getRefreshToken();
    await apiClient.post("/auth/logout", { refreshToken });
  },
  async forgotPassword(input: ForgotPasswordRequest): Promise<void> {
    await apiClient.post("/auth/forgot-password", input);
  },
  async updateProfile(input: UpdateProfileRequest): Promise<AuthUser> {
    return unwrap(await apiClient.patch("/auth/me", input));
  },
  async changePassword(input: ChangePasswordRequest): Promise<void> {
    await apiClient.patch("/auth/password", input);
  },
};
