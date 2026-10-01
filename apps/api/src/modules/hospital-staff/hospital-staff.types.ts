import type { HospitalStaffDto } from "@petcare/types";
import type { HospitalStaffWithUser } from "./hospital-staff.repository";

export function toHospitalStaffDto(staff: HospitalStaffWithUser): HospitalStaffDto {
  return {
    id: staff.id,
    hospitalId: staff.hospitalId,
    name: staff.user.name,
    email: staff.user.email,
    phone: staff.user.phone,
    avatar: staff.user.avatar,
    position: staff.position,
    status: staff.status,
    createdAt: staff.createdAt.toISOString(),
  };
}
