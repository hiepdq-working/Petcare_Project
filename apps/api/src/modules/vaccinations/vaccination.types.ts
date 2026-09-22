import type { VaccinationDto } from "@petcare/types";
import type { VaccinationWithCreator } from "./vaccination.repository";

export function toVaccinationDto(vaccination: VaccinationWithCreator): VaccinationDto {
  return {
    id: vaccination.id,
    petId: vaccination.petId,
    vaccineName: vaccination.vaccineName,
    dateGiven: vaccination.dateGiven.toISOString(),
    nextDueDate: vaccination.nextDueDate ? vaccination.nextDueDate.toISOString() : null,
    notes: vaccination.notes,
    createdById: vaccination.createdById,
    createdByName: vaccination.createdBy.name,
    createdAt: vaccination.createdAt.toISOString(),
  };
}
