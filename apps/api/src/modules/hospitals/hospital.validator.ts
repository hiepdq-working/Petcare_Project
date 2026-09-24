import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const updateHospitalSchema = z.object({
  name: z.string().trim().min(2, "Tên phòng khám quá ngắn").max(200).optional(),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  logo: z.preprocess(emptyToUndefined, z.string().url("URL không hợp lệ").max(500).optional()),
  cover: z.preprocess(emptyToUndefined, z.string().url("URL không hợp lệ").max(500).optional()),
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ đầy đủ").max(300).optional(),
  lat: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
  lng: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().toLowerCase().email("Email không hợp lệ").max(100).optional()),
  isEmergency: z.boolean().optional(),
});
export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;

export const adminCreateHospitalSchema = z.object({
  name: z.string().trim().min(2, "Tên phòng khám quá ngắn").max(200),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().toLowerCase().email("Email không hợp lệ").max(100).optional()),
  lat: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
  lng: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
  isEmergency: z.boolean().optional(),
  ownerId: z.preprocess(emptyToUndefined, z.string().uuid("ID chủ phòng khám không hợp lệ").optional()),
});
export type AdminCreateHospitalInput = z.infer<typeof adminCreateHospitalSchema>;

export const adminUpdateHospitalSchema = adminCreateHospitalSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
});
export type AdminUpdateHospitalInput = z.infer<typeof adminUpdateHospitalSchema>;

export const searchHospitalsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.preprocess(emptyToUndefined, z.coerce.number().positive().max(100).optional()).default(10),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().max(50).optional()).default(20),
});
export type SearchHospitalsInput = z.infer<typeof searchHospitalsSchema>;
