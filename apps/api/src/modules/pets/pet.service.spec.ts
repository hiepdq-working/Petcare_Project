import { PetService } from "./pet.service";
import { PetRepository } from "./pet.repository";
import { PetEventService } from "../pet-events/pet-event.service";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { PetStatus } from "@petcare/types";
import type { Pet } from "@prisma/client";

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
    status: PetStatus.ACTIVE,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  } as Pet;
}

function setup() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findManyByOwner: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<PetRepository>;

  const petEventService = {
    publish: jest.fn(),
    listByPet: jest.fn(),
  } as unknown as jest.Mocked<PetEventService>;

  const service = new PetService(repository, petEventService);
  return { service, repository, petEventService };
}

describe("PetService.create", () => {
  it("creates a pet owned by the requester, defaulting optional fields to null", async () => {
    const { service, repository } = setup();
    repository.create.mockResolvedValue(makePet());

    await service.create("owner-1", { name: "Milo", species: "Chó" });

    expect(repository.create).toHaveBeenCalledWith("owner-1", {
      name: "Milo",
      species: "Chó",
      breed: null,
      birthDate: null,
      weight: null,
      avatar: null,
      notes: null,
    });
  });

  it("parses an optional birthDate string into a Date", async () => {
    const { service, repository } = setup();
    repository.create.mockResolvedValue(makePet());

    await service.create("owner-1", { name: "Milo", species: "Chó", birthDate: "2022-05-01" });

    expect(repository.create).toHaveBeenCalledWith(
      "owner-1",
      expect.objectContaining({ birthDate: new Date("2022-05-01") }),
    );
  });
});

describe("PetService ownership checks", () => {
  it("rejects access to a pet owned by someone else", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(service.getOne("pet-1", "owner-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("raises NotFoundError for a pet that doesn't exist", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(null);

    await expect(service.getOne("missing", "owner-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("allows the owner to read their own pet", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makePet());

    const pet = await service.getOne("pet-1", "owner-1");

    expect(pet.id).toBe("pet-1");
  });

  it("blocks update and delete from a non-owner the same way as read", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(service.update("pet-1", "owner-1", { name: "New name" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(service.remove("pet-1", "owner-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });
});

describe("PetService.update", () => {
  it("only sends fields that were actually provided", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makePet());
    repository.update.mockResolvedValue(makePet({ name: "New name" }));

    await service.update("pet-1", "owner-1", { name: "New name" });

    expect(repository.update).toHaveBeenCalledWith("pet-1", { name: "New name" });
  });
});
