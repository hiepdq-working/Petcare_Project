import { apiClient, unwrap } from "../../../shared/api/client";
import type { CreateReviewRequest, HospitalReviewSummaryDto, ReviewDto, UpdateReviewRequest } from "@petcare/types";

export const reviewsApi = {
  async listByHospital(hospitalId: string): Promise<HospitalReviewSummaryDto> {
    return unwrap(await apiClient.get(`/reviews/hospital/${hospitalId}`));
  },

  async create(input: CreateReviewRequest): Promise<ReviewDto> {
    return unwrap(await apiClient.post("/reviews", input));
  },

  async update(id: string, input: UpdateReviewRequest): Promise<ReviewDto> {
    return unwrap(await apiClient.patch(`/reviews/${id}`, input));
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`);
  },
};
