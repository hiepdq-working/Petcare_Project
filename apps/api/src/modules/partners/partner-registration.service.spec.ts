import { PartnerRegistrationService } from "./partner-registration.service";
import { PartnerRegistrationRepository } from "./partner-registration.repository";
import { MailerService } from "../../lib/mailer.service";
import { AuditService } from "../audit/audit.service";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { UserRole, UserStatus } from "@petcare/types";
import type { PartnerRegistration, User } from "@prisma/client";

function makeRegistration(overrides: Partial<PartnerRegistration> = {}): PartnerRegistration {
  return {
    id: "reg-1",
    businessType: "HOSPITAL",
    shopName: "Happy Paws",
    ownerName: "Minh Anh",
    phone: "0900000000",
    email: "clinic@example.com",
    address: "123 Nguyen Trai, Q5, TP.HCM",
    businessLicense: null,
    vetCertificate: null,
    status: "PENDING",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  } as PartnerRegistration;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Minh Anh",
    email: "clinic@example.com",
    phone: "0900000000",
    password: null,
    googleId: null,
    avatar: null,
    role: UserRole.HOSPITAL_OWNER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    passwordResetToken: "token",
    passwordResetExpiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

function setup() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    markApproved: jest.fn(),
    markRejected: jest.fn(),
    findUserByEmail: jest.fn(),
    createHospitalOwnerWithHospital: jest.fn(),
  } as unknown as jest.Mocked<PartnerRegistrationRepository>;

  const mailer = {
    send: jest.fn().mockResolvedValue(undefined),
    buildPartnerApprovedContent: jest.fn().mockReturnValue({ subject: "s", html: "h" }),
    buildPartnerRejectedContent: jest.fn().mockReturnValue({ subject: "s", html: "h" }),
  } as unknown as jest.Mocked<MailerService>;

  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

  const service = new PartnerRegistrationService(repository, mailer, audit);
  return { service, repository, mailer, audit };
}

describe("PartnerRegistrationService.approve", () => {
  it("creates a HOSPITAL_OWNER account + Hospital, logs it, and emails an activation link", async () => {
    const { service, repository, mailer, audit } = setup();
    repository.findById.mockResolvedValue(makeRegistration());
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createHospitalOwnerWithHospital.mockResolvedValue({
      user: makeUser(),
      hospital: { id: "hospital-1" } as never,
    });

    await service.approve("reg-1", "admin-1");

    expect(repository.createHospitalOwnerWithHospital).toHaveBeenCalledWith(
      expect.objectContaining({ email: "clinic@example.com", shopName: "Happy Paws" }),
    );
    expect(repository.markApproved).toHaveBeenCalledWith("reg-1");
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "admin-1", action: "APPROVE", entityType: "PartnerRegistration" }),
    );
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: "clinic@example.com" }));
  });

  it("rejects approving a registration that isn't PENDING", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeRegistration({ status: "APPROVED" }));

    await expect(service.approve("reg-1", "admin-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects approving when the email is already registered", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeRegistration());
    repository.findUserByEmail.mockResolvedValue(makeUser());

    await expect(service.approve("reg-1", "admin-1")).rejects.toBeInstanceOf(ConflictError);
    expect(repository.createHospitalOwnerWithHospital).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a missing registration", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(null);

    await expect(service.approve("missing", "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("PartnerRegistrationService.reject", () => {
  it("marks the registration rejected, logs it, and emails the applicant", async () => {
    const { service, repository, mailer, audit } = setup();
    repository.findById.mockResolvedValue(makeRegistration());

    await service.reject("reg-1", "admin-1", "Thiếu giấy phép kinh doanh");

    expect(repository.markRejected).toHaveBeenCalledWith("reg-1");
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "REJECT", newValue: { reason: "Thiếu giấy phép kinh doanh" } }),
    );
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: "clinic@example.com" }));
  });

  it("rejects rejecting a registration that isn't PENDING", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeRegistration({ status: "REJECTED" }));

    await expect(service.reject("reg-1", "admin-1")).rejects.toBeInstanceOf(ConflictError);
  });
});
