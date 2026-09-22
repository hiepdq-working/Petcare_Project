import { apiClient, unwrap } from "../../../shared/api/client";
import type {
  AppointmentDto,
  AppointmentStatus,
  CreateAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from "@petcare/types";

export const appointmentsApi = {
  async create(input: CreateAppointmentRequest): Promise<AppointmentDto> {
    return unwrap(await apiClient.post("/appointments", input));
  },

  async listMine(): Promise<AppointmentDto[]> {
    return unwrap(await apiClient.get("/appointments/mine"));
  },

  async listForHospital(status?: AppointmentStatus): Promise<AppointmentDto[]> {
    return unwrap(await apiClient.get("/appointments/hospital", { params: status ? { status } : undefined }));
  },

  async listForVet(): Promise<AppointmentDto[]> {
    return unwrap(await apiClient.get("/appointments/vet"));
  },

  async updateStatus(id: string, input: UpdateAppointmentStatusRequest): Promise<AppointmentDto> {
    return unwrap(await apiClient.patch(`/appointments/${id}/status`, input));
  },

  async cancelMine(id: string): Promise<AppointmentDto> {
    return unwrap(await apiClient.patch(`/appointments/${id}/cancel`));
  },
};
