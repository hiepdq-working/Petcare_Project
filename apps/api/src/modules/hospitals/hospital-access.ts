import { UserRole } from "@petcare/types";
import type { Hospital } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import type { HospitalRepository } from "./hospital.repository";

// "The clinic this user works for": the owner's own hospital, or the one an
// ACTIVE staff member belongs to. Shared so every hospital-side feature
// resolves access the same way.
export async function findHospitalForActor(
  repository: HospitalRepository,
  userId: string,
  role: UserRole | string,
): Promise<Hospital> {
  const hospital =
    role === UserRole.HOSPITAL_STAFF
      ? await repository.findByStaffUserId(userId)
      : await repository.findByOwnerId(userId);
  if (!hospital) {
    throw new NotFoundError("Không tìm thấy phòng khám của tài khoản này");
  }
  return hospital;
}

export async function assertStaffPosition(
  repository: HospitalRepository,
  userId: string,
  allowed: readonly string[],
  message: string,
): Promise<void> {
  const staff = await repository.findStaffByUserId(userId);
  if (!staff || staff.status !== "ACTIVE" || !allowed.includes(staff.position)) {
    throw new ForbiddenError(message);
  }
}
