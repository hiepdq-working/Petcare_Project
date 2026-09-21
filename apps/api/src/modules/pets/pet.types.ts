import type { Pet } from "@prisma/client";
import type { PetDto } from "@petcare/types";

export function toPetDto(pet: Pet): PetDto {
  return {
    id: pet.id,
    ownerId: pet.ownerId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    birthDate: pet.birthDate ? pet.birthDate.toISOString() : null,
    weight: pet.weight,
    avatar: pet.avatar,
    notes: pet.notes,
    status: pet.status,
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  };
}
