import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const createVetSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập tên bác sĩ").max(100),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  specialty: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  experience: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(80).optional()),
  licenseNumber: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
});
export type CreateVetInput = z.infer<typeof createVetSchema>;

export const updateVetSchema = z.object({
  specialty: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  experience: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(80).optional()),
  licenseNumber: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export type UpdateVetInput = z.infer<typeof updateVetSchema>;
