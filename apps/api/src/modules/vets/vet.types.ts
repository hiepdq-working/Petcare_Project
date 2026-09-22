import type { VetDto } from "@petcare/types";
import type { VetWithUser } from "./vet.repository";

export function toVetDto(vet: VetWithUser): VetDto {
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
  };
}
