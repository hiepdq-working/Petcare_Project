import { Injectable } from "@nestjs/common";
import type { Pet } from "@prisma/client";
import type { PetDto } from "@petcare/types";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { PetRepository } from "./pet.repository";
import { toPetDto } from "./pet.types";
import type { CreatePetInput, UpdatePetInput } from "./pet.validator";

@Injectable()
export class PetService {
  constructor(private readonly repository: PetRepository) {}

  // Ownership is a business rule, not just a role check — RolesGuard only
  // proves "this user is a Pet Owner", not "this user owns THIS pet".
  private async findOwnedOrThrow(petId: string, requesterId: string): Promise<Pet> {
    const pet = await this.repository.findById(petId);
    if (!pet) {
      throw new NotFoundError("Không tìm thấy thú cưng");
    }
    if (pet.ownerId !== requesterId) {
      throw new ForbiddenError("Bạn không có quyền truy cập thú cưng này");
    }
    return pet;
  }

  async create(ownerId: string, input: CreatePetInput): Promise<PetDto> {
    const pet = await this.repository.create(ownerId, {
      name: input.name,
      species: input.species,
      breed: input.breed ?? null,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      weight: input.weight ?? null,
      avatar: input.avatar ?? null,
      notes: input.notes ?? null,
    });
    return toPetDto(pet);
  }

  async listMine(ownerId: string): Promise<PetDto[]> {
    const pets = await this.repository.findManyByOwner(ownerId);
    return pets.map(toPetDto);
  }

  async getOne(petId: string, requesterId: string): Promise<PetDto> {
    const pet = await this.findOwnedOrThrow(petId, requesterId);
    return toPetDto(pet);
  }

  async update(petId: string, requesterId: string, input: UpdatePetInput): Promise<PetDto> {
    await this.findOwnedOrThrow(petId, requesterId);
    const pet = await this.repository.update(petId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.species !== undefined ? { species: input.species } : {}),
      ...(input.breed !== undefined ? { breed: input.breed ?? null } : {}),
      ...(input.birthDate !== undefined
        ? { birthDate: input.birthDate ? new Date(input.birthDate) : null }
        : {}),
      ...(input.weight !== undefined ? { weight: input.weight ?? null } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar ?? null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
    });
    return toPetDto(pet);
  }

  async remove(petId: string, requesterId: string): Promise<void> {
    await this.findOwnedOrThrow(petId, requesterId);
    await this.repository.delete(petId);
  }
}
