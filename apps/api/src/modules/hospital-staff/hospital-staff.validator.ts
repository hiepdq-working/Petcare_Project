import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const createHospitalStaffSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập tên nhân viên").max(100),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  position: z.enum(["NURSE", "RECEPTIONIST"]),
});
export type CreateHospitalStaffInput = z.infer<typeof createHospitalStaffSchema>;

export const updateHospitalStaffSchema = z.object({
  position: z.enum(["NURSE", "RECEPTIONIST"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export type UpdateHospitalStaffInput = z.infer<typeof updateHospitalStaffSchema>;
