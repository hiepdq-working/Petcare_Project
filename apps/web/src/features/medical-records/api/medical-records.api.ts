import { apiClient, unwrap } from "../../../shared/api/client";
import type {
  AddMedicalFileRequest,
  AddMedicalRecordVersionRequest,
  CreateMedicalRecordRequest,
  MedicalRecordDto,
  UploadResponse,
} from "@petcare/types";

export const medicalRecordsApi = {
  async create(input: CreateMedicalRecordRequest): Promise<MedicalRecordDto> {
    return unwrap(await apiClient.post("/medical-records", input));
  },

  async listMine(): Promise<MedicalRecordDto[]> {
    return unwrap(await apiClient.get("/medical-records/mine"));
  },

  async listByPet(petId: string): Promise<MedicalRecordDto[]> {
    return unwrap(await apiClient.get(`/medical-records/pet/${petId}`));
  },

  async getOne(id: string): Promise<MedicalRecordDto> {
    return unwrap(await apiClient.get(`/medical-records/${id}`));
  },

  async addVersion(id: string, input: AddMedicalRecordVersionRequest): Promise<MedicalRecordDto> {
    return unwrap(await apiClient.patch(`/medical-records/${id}`, input));
  },

  async addFile(id: string, input: AddMedicalFileRequest): Promise<MedicalRecordDto> {
    return unwrap(await apiClient.post(`/medical-records/${id}/files`, input));
  },

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return unwrap(await apiClient.post("/uploads/documents", formData));
  },
};
