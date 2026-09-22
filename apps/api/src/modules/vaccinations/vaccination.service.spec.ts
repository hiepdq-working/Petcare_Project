import { UserRole } from "@petcare/types";
import type { Pet, User, Vaccination } from "@prisma/client";
import { VaccinationService } from "./vaccination.service";
import { VaccinationRepository } from "./vaccination.repository";
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
    user: { id: "vet-user-1", name: "BS. Minh" } as never,
    ...overrides,
  } as VetWithUser;
}

function makeVaccination(overrides: Partial<Vaccination & { createdBy: User }> = {}) {
  return {
    id: "vaccination-1",
    petId: "pet-1",
    vaccineName: "Dai",
    dateGiven: new Date(),
    nextDueDate: null,
    notes: null,
    createdById: "owner-1",
    createdBy: { id: "owner-1", name: "Chủ nuôi" },
    createdAt: new Date(),
    ...overrides,
  } as Vaccination & { createdBy: User };
}

function setup() {
  const repository = {
    create: jest.fn(),
    findManyByPet: jest.fn(),
    hasHospitalTreatedPet: jest.fn(),
  } as unknown as jest.Mocked<VaccinationRepository>;

  const petRepository = { findById: jest.fn() } as unknown as jest.Mocked<PetRepository>;
  const vetRepository = { findByUserId: jest.fn() } as unknown as jest.Mocked<VetRepository>;
  const petEventService = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PetEventService>;

  const service = new VaccinationService(repository, petRepository, vetRepository, petEventService);

  return { service, repository, petRepository, vetRepository, petEventService };
}

const validInput = { petId: "pet-1", vaccineName: "Dai", dateGiven: new Date() } as const;

describe("VaccinationService.create", () => {
  it("lets the pet owner log a vaccination for their own pet and publishes a PetEvent", async () => {
    const { service, repository, petRepository, petEventService } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    repository.create.mockResolvedValue(makeVaccination());

    await service.create("owner-1", UserRole.PET_OWNER, { ...validInput });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ createdById: "owner-1" }));
    expect(petEventService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "pet-1", eventType: "VACCINATION" }),
    );
  });

  it("rejects a pet owner logging a vaccination for someone else's pet", async () => {
    const { service, petRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(service.create("owner-1", UserRole.PET_OWNER, { ...validInput })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("lets a vet log a vaccination for a pet their hospital has treated", async () => {
    const { service, repository, petRepository, vetRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    vetRepository.findByUserId.mockResolvedValue(makeVet());
    repository.hasHospitalTreatedPet.mockResolvedValue(true);
    repository.create.mockResolvedValue(makeVaccination());

    await service.create("vet-user-1", UserRole.VET, { ...validInput });

    expect(repository.create).toHaveBeenCalled();
  });

  it("rejects a vet whose hospital has never treated the pet", async () => {
    const { service, petRepository, vetRepository, repository } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    vetRepository.findByUserId.mockResolvedValue(makeVet());
    repository.hasHospitalTreatedPet.mockResolvedValue(false);

    await expect(service.create("vet-user-1", UserRole.VET, { ...validInput })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a pet that doesn't exist", async () => {
    const { service, petRepository } = setup();
    petRepository.findById.mockResolvedValue(null);

    await expect(service.create("owner-1", UserRole.PET_OWNER, { ...validInput })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("VaccinationService.listByPet", () => {
  it("allows the pet's owner to view the list", async () => {
    const { service, petRepository, repository } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    repository.findManyByPet.mockResolvedValue([makeVaccination()]);

    const list = await service.listByPet("pet-1", "owner-1", UserRole.PET_OWNER);

    expect(list).toHaveLength(1);
  });

  it("rejects a pet owner who doesn't own the pet", async () => {
    const { service, petRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(service.listByPet("pet-1", "owner-1", UserRole.PET_OWNER)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
