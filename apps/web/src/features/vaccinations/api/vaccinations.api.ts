import { apiClient, unwrap } from "../../../shared/api/client";
import type { CreateVaccinationRequest, VaccinationDto } from "@petcare/types";

export const vaccinationsApi = {
  async create(input: CreateVaccinationRequest): Promise<VaccinationDto> {
    return unwrap(await apiClient.post("/vaccinations", input));
  },

  async listByPet(petId: string): Promise<VaccinationDto[]> {
    return unwrap(await apiClient.get(`/vaccinations/pet/${petId}`));
  },
};
