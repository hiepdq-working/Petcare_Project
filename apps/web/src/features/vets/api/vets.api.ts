import { apiClient, unwrap } from "../../../shared/api/client";
import type { CreateVetRequest, UpdateVetRequest, VetDto } from "@petcare/types";

export const vetsApi = {
  async create(input: CreateVetRequest): Promise<VetDto> {
    return unwrap(await apiClient.post("/vets", input));
  },

  async list(): Promise<VetDto[]> {
    return unwrap(await apiClient.get("/vets"));
  },

  async update(id: string, input: UpdateVetRequest): Promise<VetDto> {
    return unwrap(await apiClient.patch(`/vets/${id}`, input));
  },

  async getMyProfile(): Promise<VetDto> {
    return unwrap(await apiClient.get("/vets/me"));
  },
};
