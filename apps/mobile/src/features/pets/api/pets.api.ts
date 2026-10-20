import type { CreatePetRequest, PetDto, PetEventDto, UpdatePetRequest } from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

export const petsApi = {
  async list(): Promise<PetDto[]> {
    return unwrap(await apiClient.get("/pets"));
  },
  async get(id: string): Promise<PetDto> {
    return unwrap(await apiClient.get(`/pets/${id}`));
  },
  async create(input: CreatePetRequest): Promise<PetDto> {
    return unwrap(await apiClient.post("/pets", input));
  },
  async update(id: string, input: UpdatePetRequest): Promise<PetDto> {
    return unwrap(await apiClient.patch(`/pets/${id}`, input));
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/pets/${id}`);
  },
  async getTimeline(id: string): Promise<PetEventDto[]> {
    return unwrap(await apiClient.get(`/pets/${id}/timeline`));
  },
};
