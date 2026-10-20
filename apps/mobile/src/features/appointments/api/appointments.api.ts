import type { AppointmentDto, CreateAppointmentRequest } from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

export const appointmentsApi = {
  async create(input: CreateAppointmentRequest): Promise<AppointmentDto> {
    return unwrap(await apiClient.post("/appointments", input));
  },
  async listMine(): Promise<AppointmentDto[]> {
    return unwrap(await apiClient.get("/appointments/mine"));
  },
  async cancelMine(id: string): Promise<AppointmentDto> {
    return unwrap(await apiClient.patch(`/appointments/${id}/cancel`));
  },
};
