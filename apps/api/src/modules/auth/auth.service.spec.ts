import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { JwtService } from "@nestjs/jwt";
import { PasswordHasher } from "../../common/security/password-hasher.service";
import { MailerService } from "../../lib/mailer.service";
import { GoogleAuthService } from "../../lib/google-auth.service";
import { BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from "../../common/errors/app-error";
import { UserRole, UserStatus } from "@petcare/types";
import type { User } from "@prisma/client";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Minh Anh",
    email: "minh@example.com",
    phone: null,
    password: "hashed-password",
    googleId: null,
    avatar: null,
    role: UserRole.PET_OWNER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date("2024-01-01"),
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  } as User;
}

// Manual fakes instead of Nest's TestingModule — these are pure unit tests
// of business rules, no DI container or database needed.
function setup() {
  const repository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByGoogleId: jest.fn(),
    findByEmailVerificationToken: jest.fn(),
    findByPasswordResetToken: jest.fn(),
    createWithPassword: jest.fn(),
    createWithGoogle: jest.fn(),
    linkGoogleId: jest.fn(),
    markEmailVerified: jest.fn(),
    setPasswordResetToken: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn(),
    createRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    deleteAllRefreshTokensForUser: jest.fn(),
  } as unknown as jest.Mocked<AuthRepository>;

  const jwtService = { sign: jest.fn().mockReturnValue("signed.jwt.token") } as unknown as jest.Mocked<JwtService>;

  const passwordHasher = {
    hash: jest.fn().mockResolvedValue("hashed-password"),
    compare: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<PasswordHasher>;

  const mailer = {
    send: jest.fn().mockResolvedValue(undefined),
    buildVerifyEmailContent: jest.fn().mockReturnValue({ subject: "s", html: "h" }),
    buildResetPasswordContent: jest.fn().mockReturnValue({ subject: "s", html: "h" }),
  } as unknown as jest.Mocked<MailerService>;

  const googleAuth = {
    verifyIdToken: jest.fn(),
  } as unknown as jest.Mocked<GoogleAuthService>;

  const service = new AuthService(repository, jwtService, passwordHasher, mailer, googleAuth);

  return { service, repository, jwtService, passwordHasher, mailer, googleAuth };
}

describe("AuthService.register", () => {
  it("hashes the password, creates the user and sends a verification email", async () => {
    const { service, repository, passwordHasher, mailer } = setup();
    repository.findByEmail.mockResolvedValue(null);
    repository.createWithPassword.mockResolvedValue(makeUser({ emailVerifiedAt: null }));

    const result = await service.register({ name: "Minh Anh", email: "minh@example.com", password: "password123" });

    expect(passwordHasher.hash).toHaveBeenCalledWith("password123");
    expect(repository.createWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Minh Anh", email: "minh@example.com", passwordHash: "hashed-password" }),
    );
    expect(mailer.send).toHaveBeenCalledTimes(1);
    expect(result.message).toContain("kiểm tra email");
  });

  it("rejects when the email is already registered", async () => {
    const { service, repository } = setup();
    repository.findByEmail.mockResolvedValue(makeUser());

    await expect(
      service.register({ name: "Minh Anh", email: "minh@example.com", password: "password123" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("AuthService.login", () => {
  it("issues a session for a verified user with the correct password", async () => {
    const { service, repository, jwtService } = setup();
    repository.findByEmail.mockResolvedValue(makeUser());
    repository.createRefreshToken.mockResolvedValue({} as never);

    const session = await service.login({ email: "minh@example.com", password: "password123" });

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: "user-1", role: UserRole.PET_OWNER });
    expect(session.accessToken).toBe("signed.jwt.token");
    expect(session.refreshToken).toEqual(expect.any(String));
    expect(repository.createRefreshToken).toHaveBeenCalledWith("user-1", session.refreshToken, expect.any(Date));
  });

  it("uses the same generic error for a wrong password and a non-existent email", async () => {
    const { service, repository, passwordHasher } = setup();
    repository.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: "ghost@example.com", password: "x" })).rejects.toThrow(UnauthorizedError);

    repository.findByEmail.mockResolvedValue(makeUser());
    passwordHasher.compare.mockResolvedValue(false);
    await expect(service.login({ email: "minh@example.com", password: "wrong" })).rejects.toThrow(UnauthorizedError);
  });

  it("rejects a Google-only account (no password) with the same generic message", async () => {
    const { service, repository } = setup();
    repository.findByEmail.mockResolvedValue(makeUser({ password: null }));

    await expect(service.login({ email: "minh@example.com", password: "anything" })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("blocks login before the email is verified", async () => {
    const { service, repository } = setup();
    repository.findByEmail.mockResolvedValue(makeUser({ emailVerifiedAt: null }));

    await expect(service.login({ email: "minh@example.com", password: "password123" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("blocks a banned user even with the correct password", async () => {
    const { service, repository } = setup();
    repository.findByEmail.mockResolvedValue(makeUser({ status: UserStatus.BANNED }));

    await expect(service.login({ email: "minh@example.com", password: "password123" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("AuthService.loginWithGoogle", () => {
  it("links Google to an existing email/password account instead of duplicating it", async () => {
    const { service, repository, googleAuth } = setup();
    googleAuth.verifyIdToken.mockResolvedValue({
      googleId: "google-1",
      email: "minh@example.com",
      name: "Minh Anh",
      avatar: null,
    });
    repository.findByGoogleId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue(makeUser());
    repository.linkGoogleId.mockResolvedValue(makeUser({ googleId: "google-1" }));

    await service.loginWithGoogle({ idToken: "id-token" });

    expect(repository.linkGoogleId).toHaveBeenCalledWith("user-1", "google-1");
    expect(repository.createWithGoogle).not.toHaveBeenCalled();
  });

  it("creates a brand-new, pre-verified user when neither googleId nor email match", async () => {
    const { service, repository, googleAuth } = setup();
    googleAuth.verifyIdToken.mockResolvedValue({
      googleId: "google-2",
      email: "new@example.com",
      name: "New User",
      avatar: null,
    });
    repository.findByGoogleId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue(null);
    repository.createWithGoogle.mockResolvedValue(makeUser({ id: "user-2", googleId: "google-2" }));

    const session = await service.loginWithGoogle({ idToken: "id-token" });

    expect(repository.createWithGoogle).toHaveBeenCalled();
    expect(session.user.id).toBe("user-2");
  });
});

describe("AuthService.refreshSession", () => {
  it("rotates the refresh token: old one deleted, new one issued", async () => {
    const { service, repository } = setup();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    repository.findRefreshToken.mockResolvedValue({
      id: "rt-1",
      token: "old-token",
      userId: "user-1",
      expiresAt,
      createdAt: new Date(),
    });
    repository.findById.mockResolvedValue(makeUser());

    const session = await service.refreshSession("old-token");

    expect(repository.deleteRefreshToken).toHaveBeenCalledWith("old-token");
    expect(session.refreshToken).not.toBe("old-token");
  });

  it("rejects an expired or unknown refresh token", async () => {
    const { service, repository } = setup();
    repository.findRefreshToken.mockResolvedValue(null);

    await expect(service.refreshSession("unknown")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("AuthService.verifyEmail / forgotPassword / resetPassword", () => {
  it("rejects an expired email-verification token", async () => {
    const { service, repository } = setup();
    repository.findByEmailVerificationToken.mockResolvedValue(
      makeUser({ emailVerificationExpiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(service.verifyEmail("expired-token")).rejects.toBeInstanceOf(BadRequestError);
  });

  it("does nothing (silently) when forgotPassword is called for an unknown email", async () => {
    const { service, repository, mailer } = setup();
    repository.findByEmail.mockResolvedValue(null);

    await service.forgotPassword({ email: "ghost@example.com" });

    expect(mailer.send).not.toHaveBeenCalled();
  });

  it("invalidates every session on a successful password reset", async () => {
    const { service, repository } = setup();
    repository.findByPasswordResetToken.mockResolvedValue(
      makeUser({ passwordResetExpiresAt: new Date(Date.now() + 1000 * 60) }),
    );

    await service.resetPassword({ token: "valid-token", newPassword: "newpassword123" });

    expect(repository.resetPassword).toHaveBeenCalledWith("user-1", "hashed-password");
    expect(repository.deleteAllRefreshTokensForUser).toHaveBeenCalledWith("user-1");
  });
});

describe("AuthService.changePassword", () => {
  it("requires the correct current password when the account already has one", async () => {
    const { service, repository, passwordHasher } = setup();
    repository.findById.mockResolvedValue(makeUser());
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      service.changePassword("user-1", { currentPassword: "wrong", newPassword: "newpassword123" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(repository.updatePassword).not.toHaveBeenCalled();
  });

  it("changes the password when the current one matches", async () => {
    const { service, repository, passwordHasher } = setup();
    repository.findById.mockResolvedValue(makeUser());
    passwordHasher.compare.mockResolvedValue(true);

    await service.changePassword("user-1", { currentPassword: "correct", newPassword: "newpassword123" });

    expect(repository.updatePassword).toHaveBeenCalledWith("user-1", "hashed-password");
  });

  it("lets a Google-only account set a password without a current one", async () => {
    const { service, repository, passwordHasher } = setup();
    repository.findById.mockResolvedValue(makeUser({ password: null }));

    await service.changePassword("user-1", { newPassword: "newpassword123" });

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(repository.updatePassword).toHaveBeenCalledWith("user-1", "hashed-password");
  });
});

describe("AuthService.updateProfile", () => {
  it("updates and returns the profile", async () => {
    const { service, repository } = setup();
    repository.updateProfile.mockResolvedValue(makeUser({ name: "New Name", phone: "0909123456" }));

    const result = await service.updateProfile("user-1", { name: "New Name", phone: "0909123456" });

    expect(repository.updateProfile).toHaveBeenCalledWith("user-1", { name: "New Name", phone: "0909123456" });
    expect(result.name).toBe("New Name");
  });
});
