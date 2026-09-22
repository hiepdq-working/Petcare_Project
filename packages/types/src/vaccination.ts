export interface VaccinationDto {
  id: string;
  petId: string;
  vaccineName: string;
  dateGiven: string;
  nextDueDate: string | null;
  notes: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface CreateVaccinationRequest {
  petId: string;
  vaccineName: string;
  dateGiven: string;
  nextDueDate?: string;
  notes?: string;
}
