import type { PetEvent, Prisma } from "@prisma/client";
import type { PetEventDto } from "@petcare/types";

export function toPetEventDto(event: PetEvent): PetEventDto {
  return {
    id: event.id,
    petId: event.petId,
    eventType: event.eventType,
    eventDate: event.eventDate.toISOString(),
    referenceType: event.referenceType,
    referenceId: event.referenceId,
    payload: (event.payload as Prisma.JsonObject | null) ?? null,
    createdAt: event.createdAt.toISOString(),
  };
}
