import { apiClient, unwrap } from "../../../shared/api/client";
import type {
  AdminCreateHospitalRequest,
  AdminUpdateHospitalRequest,
  HospitalDto,
  HospitalSearchResultDto,
  SearchHospitalsQuery,
  UpdateHospitalRequest,
  UploadResponse,
} from "@petcare/types";

export const hospitalApi = {
  // Public — no auth required, see hospitals.controller.ts.
  async searchNearby(query: SearchHospitalsQuery): Promise<HospitalSearchResultDto[]> {
    return unwrap(await apiClient.get("/hospitals/nearby", { params: query }));
  },

  async getPublicById(id: string): Promise<HospitalDto> {
    return unwrap(await apiClient.get(`/hospitals/${id}`));
  },

  async getMine(): Promise<HospitalDto> {
    return unwrap(await apiClient.get("/hospitals/me"));
  },

  async updateMine(input: UpdateHospitalRequest): Promise<HospitalDto> {
    return unwrap(await apiClient.patch("/hospitals/me", input));
  },

  // Authenticated (Hospital Owner already logged in) — distinct from
  // partnersApi.uploadDocument, which is the public, pre-account version.
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return unwrap(await apiClient.post("/uploads", formData));
  },

  // Admin-only — every hospital regardless of status.
  async adminList(): Promise<HospitalDto[]> {
    return unwrap(await apiClient.get("/hospitals"));
  },

  async adminCreate(input: AdminCreateHospitalRequest): Promise<HospitalDto> {
    return unwrap(await apiClient.post("/hospitals", input));
  },

  async adminUpdate(id: string, input: AdminUpdateHospitalRequest): Promise<HospitalDto> {
    return unwrap(await apiClient.patch(`/hospitals/${id}`, input));
  },

  async adminDeactivate(id: string): Promise<HospitalDto> {
    return unwrap(await apiClient.delete(`/hospitals/${id}`));
  },
};
