import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import { UserStatus } from "@petcare/types";
import type { AuthUser } from "@petcare/types";
import { BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from "../../common/errors/app-error";
import { PasswordHasher } from "../../common/security/password-hasher.service";
import { GoogleAuthService } from "../../lib/google-auth.service";
import { MailerService } from "../../lib/mailer.service";
import { generateOpaqueToken } from "../../lib/tokens";
import { AuthRepository } from "./auth.repository";
import { toAuthUser } from "./auth.types";
import type {
  ForgotPasswordInput,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.validator";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const REFRESH_TOKEN_TTL_DAYS = 30;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_HOURS = 1;

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: MailerService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  private assertLoginable(user: User): void {
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenError("Tài khoản của bạn đã bị khoá");
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenError("Tài khoản của bạn đang tạm ngưng hoạt động");
    }
  }

  private async issueSession(user: User): Promise<Session> {
    const refreshToken = generateOpaqueToken();
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * DAY_MS);
    await this.repository.createRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

    return {
      user: toAuthUser(user),
      accessToken: this.jwtService.sign({ sub: user.id, role: user.role }),
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  async register(input: RegisterInput): Promise<{ message: string }> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email này đã được sử dụng");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const emailVerificationToken = generateOpaqueToken();
    const emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * HOUR_MS);

    const user = await this.repository.createWithPassword({
      name: input.name,
      email: input.email,
      passwordHash,
      emailVerificationToken,
      emailVerificationExpiresAt,
    });

    const content = this.mailer.buildVerifyEmailContent(user.name, emailVerificationToken);
    await this.mailer.send({ to: user.email, ...content });

    return { message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản." };
  }

  async login(input: LoginInput): Promise<Session> {
    const user = await this.repository.findByEmail(input.email);
    // Same generic message whether the email doesn't exist, has no
    // password (Google-only account), or the password is wrong — never
    // let an attacker learn which emails are registered.
    if (!user?.password || !(await this.passwordHasher.compare(input.password, user.password))) {
      throw new UnauthorizedError("Email hoặc mật khẩu không đúng");
    }

    this.assertLoginable(user);

    if (!user.emailVerifiedAt) {
      throw new ForbiddenError("Vui lòng xác thực email trước khi đăng nhập");
    }

    return this.issueSession(user);
  }

  async loginWithGoogle(input: GoogleLoginInput): Promise<Session> {
    const profile = await this.googleAuth.verifyIdToken(input.idToken);

    let user = await this.repository.findByGoogleId(profile.googleId);

    if (!user) {
      const byEmail = await this.repository.findByEmail(profile.email);
      if (byEmail) {
        // Same person, previously registered by email/password — link
        // accounts instead of creating a duplicate.
        user = await this.repository.linkGoogleId(byEmail.id, profile.googleId);
      } else {
        user = await this.repository.createWithGoogle({
          name: profile.name,
          email: profile.email,
          googleId: profile.googleId,
          avatar: profile.avatar,
        });
      }
    }

    this.assertLoginable(user);
    return this.issueSession(user);
  }

  async refreshSession(refreshTokenValue: string): Promise<Session> {
    const stored = await this.repository.findRefreshToken(refreshTokenValue);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
    }

    // Rotation: the old token is single-use. If it's ever replayed after
    // this point (e.g. stolen), it will already be gone and the replay
    // fails — see ARCHITECTURE.md.
    await this.repository.deleteRefreshToken(refreshTokenValue);

    const user = await this.repository.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    this.assertLoginable(user);

    return this.issueSession(user);
  }

  async logout(refreshTokenValue: string): Promise<void> {
    await this.repository.deleteRefreshToken(refreshTokenValue);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.repository.findByEmailVerificationToken(token);
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw new BadRequestError("Liên kết xác thực không hợp lệ hoặc đã hết hạn");
    }

    await this.repository.markEmailVerified(user.id);
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.repository.findByEmail(input.email);
    // Silently no-op when the email doesn't exist or is Google-only — don't reveal that.
    if (!user || !user.password) {
      return;
    }

    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * HOUR_MS);
    await this.repository.setPasswordResetToken(user.id, token, expiresAt);

    const content = this.mailer.buildResetPasswordContent(user.name, token);
    await this.mailer.send({ to: user.email, ...content });
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await this.repository.findByPasswordResetToken(input.token);
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.repository.resetPassword(user.id, passwordHash);
    // Force re-login on every device once the password changes.
    await this.repository.deleteAllRefreshTokensForUser(user.id);
  }
}
