import type { UserRole, UserStatus } from "./enums";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  // Google-only accounts have none yet — the Settings page uses this to
  // show "Đặt mật khẩu" (no current-password field) instead of "Đổi mật
  // khẩu" (current-password required).
  hasPassword: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar?: string | null;
}

export interface ChangePasswordRequest {
  // Omitted only when the account has no password yet (Google-only) —
  // see AuthUser.hasPassword.
  currentPassword?: string;
  newPassword: string;
}
