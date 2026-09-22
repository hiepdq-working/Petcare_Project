import type { Hospital } from "@prisma/client";
import type { HospitalDto } from "@petcare/types";

export function toHospitalDto(hospital: Hospital): HospitalDto {
  return {
    id: hospital.id,
    ownerId: hospital.ownerId,
    name: hospital.name,
    description: hospital.description,
    logo: hospital.logo,
    cover: hospital.cover,
    address: hospital.address,
    lat: hospital.lat,
    lng: hospital.lng,
    phone: hospital.phone,
    email: hospital.email,
    status: hospital.status,
    isEmergency: hospital.isEmergency,
    createdAt: hospital.createdAt.toISOString(),
    updatedAt: hospital.updatedAt.toISOString(),
  };
}
