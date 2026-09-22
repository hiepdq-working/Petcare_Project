export const PartnerRegistrationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type PartnerRegistrationStatus =
  (typeof PartnerRegistrationStatus)[keyof typeof PartnerRegistrationStatus];

export interface PartnerRegistrationDto {
  id: string;
  businessType: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  businessLicense: string | null;
  vetCertificate: string | null;
  status: PartnerRegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerRegistrationRequest {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  // Required — Admin must be able to see the license before approving.
  businessLicense: string;
  vetCertificate?: string;
}

export interface RejectPartnerRegistrationRequest {
  reason?: string;
}
