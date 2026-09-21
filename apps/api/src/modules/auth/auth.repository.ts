import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

// Only this class talks to Prisma for the auth module — AuthService asks
// for `findByEmail`, not "run this query" (see ARCHITECTURE.md module rules).
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { emailVerificationToken: token } });
  }

  findByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { passwordResetToken: token } });
  }

  createWithPassword(input: {
    name: string;
    email: string;
    passwordHash: string;
    emailVerificationToken: string;
    emailVerificationExpiresAt: Date;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: input.passwordHash,
        emailVerificationToken: input.emailVerificationToken,
        emailVerificationExpiresAt: input.emailVerificationExpiresAt,
      },
    });
  }

  createWithGoogle(input: {
    name: string;
    email: string;
    googleId: string;
    avatar: string | null;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        googleId: input.googleId,
        avatar: input.avatar,
        emailVerifiedAt: new Date(), // Google already verified this email for us.
      },
    });
  }

  linkGoogleId(userId: string, googleId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { googleId } });
  }

  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });
  }

  setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });
  }

  resetPassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
    });
  }

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  deleteRefreshToken(token: string) {
    return this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  deleteAllRefreshTokensForUser(userId: string) {
    return this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
