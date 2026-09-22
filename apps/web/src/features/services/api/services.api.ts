import { apiClient, unwrap } from "../../../shared/api/client";
import type { CreateServiceRequest, ServiceDto, UpdateServiceRequest } from "@petcare/types";

export const servicesApi = {
  async list(): Promise<ServiceDto[]> {
    return unwrap(await apiClient.get("/services"));
  },

  // Public — for the booking flow's "pick a service" step.
  async listPublicByHospital(hospitalId: string): Promise<ServiceDto[]> {
    return unwrap(await apiClient.get(`/services/hospital/${hospitalId}`));
  },

  async create(input: CreateServiceRequest): Promise<ServiceDto> {
    return unwrap(await apiClient.post("/services", input));
  },

  async update(id: string, input: UpdateServiceRequest): Promise<ServiceDto> {
    return unwrap(await apiClient.patch(`/services/${id}`, input));
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  },
};
