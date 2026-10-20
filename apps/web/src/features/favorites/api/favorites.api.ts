import { apiClient, unwrap } from "../../../shared/api/client";
import type { FavoriteHospitalDto, ToggleFavoriteResponse } from "@petcare/types";

export const favoritesApi = {
  async listHospitals(): Promise<FavoriteHospitalDto[]> {
    return unwrap(await apiClient.get("/favorites/hospitals"));
  },

  async toggleHospital(hospitalId: string): Promise<ToggleFavoriteResponse> {
    return unwrap(await apiClient.post(`/favorites/hospitals/${hospitalId}`));
  },
};
