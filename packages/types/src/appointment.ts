export const AppointmentStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export interface AppointmentDto {
  id: string;
  petId: string;
  petName: string;
  petAvatar: string | null;
  hospitalId: string;
  hospitalName: string;
  serviceId: string;
  serviceName: string;
  vetId: string | null;
  vetName: string | null;
  dateTime: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  petId: string;
  hospitalId: string;
  serviceId: string;
  vetId?: string;
  dateTime: string;
  notes?: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  notes?: string;
}
