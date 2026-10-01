import type { VetDto, VetSummaryDto } from "@petcare/types";
import type { VetWithUser } from "./vet.repository";

export function toVetDto(vet: VetWithUser, hospitalBrandColor?: string | null): VetDto {
  return {
    id: vet.id,
    hospitalId: vet.hospitalId,
    name: vet.user.name,
    email: vet.user.email,
    phone: vet.user.phone,
    avatar: vet.user.avatar,
    specialty: vet.specialty,
    experience: vet.experience,
    licenseNumber: vet.licenseNumber,
    status: vet.status,
    createdAt: vet.createdAt.toISOString(),
    ...(hospitalBrandColor !== undefined ? { hospitalBrandColor } : {}),
  };
}

export function toVetSummaryDto(vet: VetWithUser): VetSummaryDto {
  return {
    id: vet.id,
    name: vet.user.name,
    avatar: vet.user.avatar,
    specialty: vet.specialty,
    experience: vet.experience,
  };
}
