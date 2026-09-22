import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự").max(100),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(72, "Mật khẩu tối đa 72 ký tự"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Thiếu idToken"),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Thiếu token"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Thiếu token"),
  newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").max(72),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự").max(100).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  avatar: z.preprocess(emptyToUndefined, z.string().trim().url().optional().nullable()),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// currentPassword's presence is checked against the account in
// AuthService.changePassword (a business rule, not shape validation) —
// a Google-only account has none yet, so it can't be required here.
export const changePasswordSchema = z.object({
  currentPassword: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").max(72),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
