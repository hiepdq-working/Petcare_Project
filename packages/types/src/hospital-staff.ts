export const StaffPosition = {
  NURSE: "NURSE",
  RECEPTIONIST: "RECEPTIONIST",
} as const;
export type StaffPosition = (typeof StaffPosition)[keyof typeof StaffPosition];

export interface HospitalStaffDto {
  id: string;
  hospitalId: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  position: StaffPosition;
  status: string;
  createdAt: string;
}

export interface CreateHospitalStaffRequest {
  name: string;
  email: string;
  phone?: string;
  position: StaffPosition;
}

export interface UpdateHospitalStaffRequest {
  position?: StaffPosition;
  status?: string;
}
