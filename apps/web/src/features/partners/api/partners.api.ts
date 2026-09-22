import { apiClient, unwrap, unwrapMessage } from "../../../shared/api/client";
import type {
  CreatePartnerRegistrationRequest,
  PartnerRegistrationDto,
  RejectPartnerRegistrationRequest,
  UploadResponse,
} from "@petcare/types";

export const partnersApi = {
  async submit(input: CreatePartnerRegistrationRequest): Promise<{ message: string }> {
    const message = unwrapMessage(await apiClient.post("/partner-registrations", input));
    return { message };
  },

  // Public, unauthenticated — the applicant has no account yet. Distinct
  // from petsApi.uploadAvatar's endpoint, which requires login.
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return unwrap(await apiClient.post("/partner-registrations/documents", formData));
  },

  async list(status?: string): Promise<PartnerRegistrationDto[]> {
    return unwrap(await apiClient.get("/partner-registrations", { params: status ? { status } : undefined }));
  },

  async approve(id: string): Promise<void> {
    await apiClient.post(`/partner-registrations/${id}/approve`);
  },

  async reject(id: string, input: RejectPartnerRegistrationRequest): Promise<void> {
    await apiClient.post(`/partner-registrations/${id}/reject`, input);
  },
};
