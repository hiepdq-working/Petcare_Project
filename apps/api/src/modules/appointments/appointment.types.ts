import type { AppointmentDto } from "@petcare/types";
import type { AppointmentWithRelations } from "./appointment.repository";

export function toAppointmentDto(appointment: AppointmentWithRelations): AppointmentDto {
  return {
    id: appointment.id,
    petId: appointment.petId,
    petName: appointment.pet.name,
    petAvatar: appointment.pet.avatar,
    hospitalId: appointment.hospitalId ?? "",
    hospitalName: appointment.hospital?.name ?? "",
    serviceId: appointment.serviceId,
    serviceName: appointment.service.name,
    vetId: appointment.vetId,
    vetName: appointment.vet?.user.name ?? null,
    dateTime: appointment.dateTime.toISOString(),
    notes: appointment.notes,
    status: appointment.status,
    createdAt: appointment.createdAt.toISOString(),
  };
}
