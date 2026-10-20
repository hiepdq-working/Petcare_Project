import type { FavoriteHospitalDto, ToggleFavoriteResponse } from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

export const favoritesApi = {
  async listHospitals(): Promise<FavoriteHospitalDto[]> {
    return unwrap(await apiClient.get("/favorites/hospitals"));
  },
  async toggleHospital(hospitalId: string): Promise<ToggleFavoriteResponse> {
    return unwrap(await apiClient.post(`/favorites/hospitals/${hospitalId}`));
  },
};
