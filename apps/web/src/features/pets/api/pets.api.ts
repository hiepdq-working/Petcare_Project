import { apiClient, unwrap } from "../../../shared/api/client";
import type { CreatePetRequest, PetDto, UpdatePetRequest, UploadResponse } from "@petcare/types";

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

  async uploadAvatar(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return unwrap(await apiClient.post("/uploads", formData));
  },
};
