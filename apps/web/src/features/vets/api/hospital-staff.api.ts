import { apiClient, unwrap } from "../../../shared/api/client";
import type {
  CreateHospitalStaffRequest,
  HospitalStaffDto,
  HospitalStaffMeDto,
  UpdateHospitalStaffRequest,
} from "@petcare/types";

export const hospitalStaffApi = {
  async getMe(): Promise<HospitalStaffMeDto> {
    return unwrap(await apiClient.get("/hospital-staff/me"));
  },

  async create(input: CreateHospitalStaffRequest): Promise<HospitalStaffDto> {
    return unwrap(await apiClient.post("/hospital-staff", input));
  },

  async list(): Promise<HospitalStaffDto[]> {
    return unwrap(await apiClient.get("/hospital-staff"));
  },

  async update(id: string, input: UpdateHospitalStaffRequest): Promise<HospitalStaffDto> {
    return unwrap(await apiClient.patch(`/hospital-staff/${id}`, input));
  },
};
