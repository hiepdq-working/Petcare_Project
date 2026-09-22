import { VetService } from "./vet.service";
import { VetRepository, type VetWithUser } from "./vet.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { MailerService } from "../../lib/mailer.service";
import { ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { ShopStatus, UserRole, UserStatus } from "@petcare/types";
import type { Hospital, User } from "@prisma/client";

function makeHospital(overrides: Partial<Hospital> = {}): Hospital {
  return {
    id: "hospital-1",
    ownerId: "owner-1",
    name: "Happy Paws",
    description: null,
    logo: null,
    cover: null,
    address: "123 Nguyen Trai",
    lat: null,
    lng: null,
    phone: null,
    email: null,
    status: ShopStatus.ACTIVE,
    isEmergency: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  } as Hospital;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "vet-user-1",
    name: "BS. Minh",
    email: "vet@example.com",
    phone: null,
    password: null,
    googleId: null,
    avatar: null,
    role: UserRole.VET,
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

function makeVet(overrides: Partial<VetWithUser> = {}): VetWithUser {
  return {
    id: "vet-1",
    hospitalId: "hospital-1",
    userId: "vet-user-1",
    specialty: null,
    experience: null,
    licenseNumber: null,
    status: "ACTIVE",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    user: makeUser(),
    ...overrides,
  } as VetWithUser;
}

function setup() {
  const repository = {
    findUserByEmail: jest.fn(),
    create: jest.fn(),
    findManyByHospital: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<VetRepository>;

  const hospitalRepository = {
    findByOwnerId: jest.fn(),
  } as unknown as jest.Mocked<HospitalRepository>;

  const mailer = {
    send: jest.fn().mockResolvedValue(undefined),
    buildVetInvitedContent: jest.fn().mockReturnValue({ subject: "s", html: "h" }),
  } as unknown as jest.Mocked<MailerService>;

  const service = new VetService(repository, hospitalRepository, mailer);
  return { service, repository, hospitalRepository, mailer };
}

describe("VetService.create", () => {
  it("creates a vet under the requester's hospital and emails an activation link", async () => {
    const { service, repository, hospitalRepository, mailer } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findUserByEmail.mockResolvedValue(null);
    repository.create.mockResolvedValue(makeVet());

    await service.create("owner-1", { name: "BS. Minh", email: "vet@example.com" });

    expect(repository.create).toHaveBeenCalledWith(
      "hospital-1",
      expect.objectContaining({ name: "BS. Minh", email: "vet@example.com" }),
    );
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: "vet@example.com" }));
  });

  it("rejects when the email already has an account", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findUserByEmail.mockResolvedValue(makeUser());

    await expect(service.create("owner-1", { name: "BS. Minh", email: "vet@example.com" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("raises NotFoundError when the account owns no hospital", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(null);

    await expect(service.create("owner-1", { name: "BS. Minh", email: "vet@example.com" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("VetService ownership checks", () => {
  it("rejects reading a vet that belongs to a different hospital", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeVet({ hospitalId: "someone-elses-hospital" }));

    await expect(service.getOneMine("owner-1", "vet-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects updating a vet that belongs to a different hospital", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeVet({ hospitalId: "someone-elses-hospital" }));

    await expect(service.update("owner-1", "vet-1", { status: "INACTIVE" })).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("allows reading a vet that belongs to the requester's own hospital", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeVet());

    const vet = await service.getOneMine("owner-1", "vet-1");

    expect(vet.id).toBe("vet-1");
  });
});

describe("VetService.getMyProfile", () => {
  it("returns the vet profile linked to the requester's own user id", async () => {
    const { service, repository } = setup();
    repository.findByUserId.mockResolvedValue(makeVet());

    const vet = await service.getMyProfile("vet-user-1");

    expect(vet.name).toBe("BS. Minh");
  });

  it("raises NotFoundError when the user has no vet profile", async () => {
    const { service, repository } = setup();
    repository.findByUserId.mockResolvedValue(null);

    await expect(service.getMyProfile("vet-user-1")).rejects.toBeInstanceOf(NotFoundError);
  });
});
