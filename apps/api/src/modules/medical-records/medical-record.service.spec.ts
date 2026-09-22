import { UserRole } from "@petcare/types";
import type { Pet } from "@prisma/client";
import { MedicalRecordService } from "./medical-record.service";
import { MedicalRecordRepository, type MedicalRecordWithRelations } from "./medical-record.repository";
import { PetRepository } from "../pets/pet.repository";
import { VetRepository, type VetWithUser } from "../vets/vet.repository";
import { PetEventService } from "../pet-events/pet-event.service";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: "pet-1",
    ownerId: "owner-1",
    name: "Milo",
    species: "Chó",
    breed: null,
    birthDate: null,
    weight: null,
    avatar: null,
    notes: null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Pet;
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
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: "vet-user-1", name: "BS. Minh", email: "vet@example.com" } as never,
    ...overrides,
  } as VetWithUser;
}

function makeVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: "version-1",
    recordId: "record-1",
    versionNo: 1,
    diagnosis: "Viêm da",
    treatment: "Bôi thuốc",
    symptoms: null,
    cause: null,
    conclusion: null,
    notes: null,
    editedById: "vet-user-1",
    editedBy: { id: "vet-user-1", name: "BS. Minh" },
    createdAt: new Date(),
    ...overrides,
  };
}

function makeRecord(overrides: Partial<MedicalRecordWithRelations> = {}): MedicalRecordWithRelations {
  const versions = (overrides.versions as unknown[]) ?? [makeVersion()];
  return {
    id: "record-1",
    petId: "pet-1",
    vetId: "vet-1",
    hospitalId: "hospital-1",
    status: "NEW",
    recordDate: new Date(),
    currentVersionId: "version-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    pet: makePet(),
    vet: makeVet(),
    hospital: { id: "hospital-1", name: "Happy Paws" } as never,
    versions,
    files: [],
    ...overrides,
  } as unknown as MedicalRecordWithRelations;
}

function setup() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findManyByPet: jest.fn(),
    findManyByVet: jest.fn(),
    addVersion: jest.fn(),
    addFile: jest.fn(),
    hasHospitalTreatedPet: jest.fn(),
  } as unknown as jest.Mocked<MedicalRecordRepository>;

  const petRepository = { findById: jest.fn() } as unknown as jest.Mocked<PetRepository>;
  const vetRepository = { findByUserId: jest.fn() } as unknown as jest.Mocked<VetRepository>;
  const petEventService = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PetEventService>;

  const service = new MedicalRecordService(repository, petRepository, vetRepository, petEventService);

  return { service, repository, petRepository, vetRepository, petEventService };
}

const validInput = { petId: "pet-1", diagnosis: "Viêm da" } as const;

describe("MedicalRecordService.create", () => {
  it("creates a record and publishes a MEDICAL PetEvent", async () => {
    const { service, repository, petRepository, vetRepository, petEventService } = setup();
    vetRepository.findByUserId.mockResolvedValue(makeVet());
    petRepository.findById.mockResolvedValue(makePet());
    repository.hasHospitalTreatedPet.mockResolvedValue(true);
    repository.create.mockResolvedValue(makeRecord());

    await service.create("vet-user-1", { ...validInput });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "pet-1", vetId: "vet-1", hospitalId: "hospital-1" }),
    );
    expect(petEventService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "pet-1", eventType: "MEDICAL", referenceId: "record-1" }),
    );
  });

  it("rejects a vet with no profile", async () => {
    const { service, vetRepository } = setup();
    vetRepository.findByUserId.mockResolvedValue(null);

    await expect(service.create("vet-user-1", { ...validInput })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a pet the requesting vet's hospital has never treated", async () => {
    const { service, petRepository, vetRepository, repository } = setup();
    vetRepository.findByUserId.mockResolvedValue(makeVet());
    petRepository.findById.mockResolvedValue(makePet());
    repository.hasHospitalTreatedPet.mockResolvedValue(false);

    await expect(service.create("vet-user-1", { ...validInput })).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a pet that doesn't exist", async () => {
    const { service, petRepository, vetRepository } = setup();
    vetRepository.findByUserId.mockResolvedValue(makeVet());
    petRepository.findById.mockResolvedValue(null);

    await expect(service.create("vet-user-1", { ...validInput })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("MedicalRecordService.getOne", () => {
  it("allows the pet's owner to view the record", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeRecord());

    const dto = await service.getOne("record-1", "owner-1", UserRole.PET_OWNER);

    expect(dto.id).toBe("record-1");
  });

  it("rejects a Pet Owner who doesn't own the pet", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeRecord({ pet: makePet({ ownerId: "someone-else" }) }));

    await expect(service.getOne("record-1", "owner-1", UserRole.PET_OWNER)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows a vet at the same hospital to view the record", async () => {
    const { service, repository, vetRepository } = setup();
    vetRepository.findByUserId.mockResolvedValue(makeVet());
    repository.findById.mockResolvedValue(makeRecord());

    const dto = await service.getOne("record-1", "vet-user-1", UserRole.VET);

    expect(dto.id).toBe("record-1");
  });

  it("rejects a vet from a different hospital", async () => {
    const { service, repository, vetRepository } = setup();
    vetRepository.findByUserId.mockResolvedValue(makeVet({ hospitalId: "another-hospital" }));
    repository.findById.mockResolvedValue(makeRecord());

    await expect(service.getOne("record-1", "vet-user-1", UserRole.VET)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("raises NotFoundError for a record that doesn't exist", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(null);

    await expect(service.getOne("missing", "owner-1", UserRole.PET_OWNER)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("MedicalRecordService.addVersion", () => {
  it("lets a vet at the record's hospital add a new version", async () => {
    const { service, repository, vetRepository } = setup();
    vetRepository.findByUserId.mockResolvedValue(makeVet());
    repository.findById.mockResolvedValue(makeRecord());
    repository.addVersion.mockResolvedValue(makeRecord({ versions: [makeVersion({ versionNo: 2 })] as never }));

    await service.addVersion("record-1", "vet-user-1", { diagnosis: "Đã khỏi" });

    expect(repository.addVersion).toHaveBeenCalledWith("record-1", "vet-user-1", { diagnosis: "Đã khỏi" });
  });

  it("rejects a vet from a different hospital", async () => {
    const { service, repository, vetRepository } = setup();
    vetRepository.findByUserId.mockResolvedValue(makeVet({ hospitalId: "another-hospital" }));
    repository.findById.mockResolvedValue(makeRecord());

    await expect(service.addVersion("record-1", "vet-user-1", { diagnosis: "x" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.addVersion).not.toHaveBeenCalled();
  });
});
