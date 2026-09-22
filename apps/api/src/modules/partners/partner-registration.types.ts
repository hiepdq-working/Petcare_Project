import type { PartnerRegistration } from "@prisma/client";
import type { PartnerRegistrationDto, PartnerRegistrationStatus } from "@petcare/types";

export function toPartnerRegistrationDto(registration: PartnerRegistration): PartnerRegistrationDto {
  return {
    id: registration.id,
    businessType: registration.businessType,
    shopName: registration.shopName,
    ownerName: registration.ownerName,
    phone: registration.phone,
    email: registration.email,
    address: registration.address,
    businessLicense: registration.businessLicense,
    vetCertificate: registration.vetCertificate,
    status: registration.status as PartnerRegistrationStatus,
    createdAt: registration.createdAt.toISOString(),
    updatedAt: registration.updatedAt.toISOString(),
  };
}
