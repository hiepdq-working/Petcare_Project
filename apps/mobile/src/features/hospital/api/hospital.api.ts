import type {
  CreateReviewRequest,
  HospitalDto,
  HospitalReviewSummaryDto,
  HospitalSearchResultDto,
  ReviewDto,
  SearchHospitalsQuery,
  ServiceDto,
  VetSummaryDto,
} from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

export const hospitalApi = {
  async searchNearby(query: SearchHospitalsQuery): Promise<HospitalSearchResultDto[]> {
    return unwrap(await apiClient.get("/hospitals/nearby", { params: query }));
  },
  async getPublicById(id: string): Promise<HospitalDto> {
    return unwrap(await apiClient.get(`/hospitals/${id}`));
  },
  async listServices(hospitalId: string): Promise<ServiceDto[]> {
    return unwrap(await apiClient.get(`/services/hospital/${hospitalId}`));
  },
  async listVets(hospitalId: string): Promise<VetSummaryDto[]> {
    return unwrap(await apiClient.get(`/vets/hospital/${hospitalId}`));
  },
  async listReviews(hospitalId: string): Promise<HospitalReviewSummaryDto> {
    return unwrap(await apiClient.get(`/reviews/hospital/${hospitalId}`));
  },
  async createReview(input: CreateReviewRequest): Promise<ReviewDto> {
    return unwrap(await apiClient.post("/reviews", input));
  },
};
