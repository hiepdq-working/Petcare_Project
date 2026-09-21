import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ok } from "../../common/response/api-response";
import { UnauthorizedError } from "../../common/errors/app-error";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthService, type Session } from "./auth.service";
import { clearRefreshTokenCookie, REFRESH_TOKEN_COOKIE, setRefreshTokenCookie } from "./auth.cookie";
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type GoogleLoginInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "./auth.validator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private respondWithSession(res: Response, session: Session, message: string) {
    setRefreshTokenCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
    return ok({ user: session.user, accessToken: session.accessToken }, message);
  }

  @Post("register")
  async register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    const result = await this.authService.register(body);
    return ok(null, result.message);
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(body);
    return this.respondWithSession(res, session, "Đăng nhập thành công");
  }

  @Post("google")
  @HttpCode(200)
  async loginWithGoogle(
    @Body(new ZodValidationPipe(googleLoginSchema)) body: GoogleLoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.loginWithGoogle(body);
    return this.respondWithSession(res, session, "Đăng nhập thành công");
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!token) {
      throw new UnauthorizedError("Không tìm thấy phiên đăng nhập");
    }
    const session = await this.authService.refreshSession(token);
    return this.respondWithSession(res, session, "Làm mới phiên đăng nhập thành công");
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (token) {
      await this.authService.logout(token);
    }
    clearRefreshTokenCookie(res);
    return ok(null, "Đã đăng xuất");
  }

  @Post("verify-email")
  @HttpCode(200)
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) body: VerifyEmailInput) {
    await this.authService.verifyEmail(body.token);
    return ok(null, "Xác thực email thành công");
  }

  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput) {
    await this.authService.forgotPassword(body);
    return ok(null, "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi");
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput) {
    await this.authService.resetPassword(body);
    return ok(null, "Đặt lại mật khẩu thành công");
  }
}
