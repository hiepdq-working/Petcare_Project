import { apiClient, unwrap } from "../../../shared/api/client";
import type {
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
};
