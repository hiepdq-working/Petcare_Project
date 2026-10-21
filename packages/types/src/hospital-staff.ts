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

// What a staff member's own workspace needs: their position (drives the
// sidebar and which actions they may take) and the clinic they work at.
export interface HospitalStaffMeDto {
  position: StaffPosition;
  hospital: { id: string; name: string; brandColor: string | null };
}

// Which appointment status changes each position may make. The hospital
// owner is unrestricted (the API's own state machine still applies); the
// web uses the same table to decide which action buttons to render.
export const STAFF_APPOINTMENT_TRANSITIONS: Record<StaffPosition, Record<string, string[]>> = {
  RECEPTIONIST: {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CANCELLED"],
  },
  NURSE: {
    CONFIRMED: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
  },
};

// Medical records contain clinical detail — only nurses may read them.
export const STAFF_POSITIONS_WITH_RECORD_ACCESS: StaffPosition[] = ["NURSE"];
