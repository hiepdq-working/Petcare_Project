import type { CreateVaccinationRequest, MedicalRecordDto, VaccinationDto } from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

export const healthApi = {
  async listVaccinations(petId: string): Promise<VaccinationDto[]> {
    return unwrap(await apiClient.get(`/vaccinations/pet/${petId}`));
  },
  async createVaccination(input: CreateVaccinationRequest): Promise<VaccinationDto> {
    return unwrap(await apiClient.post("/vaccinations", input));
  },
  async getMedicalRecord(id: string): Promise<MedicalRecordDto> {
    return unwrap(await apiClient.get(`/medical-records/${id}`));
  },
};
