import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

const roleEnum = z.enum(["PET_OWNER", "HOSPITAL_OWNER", "HOSPITAL_STAFF", "VET", "ADMIN"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE", "BANNED"]);

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2, "Tên quá ngắn").max(100),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ").max(100),
  role: roleEnum,
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
});
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2, "Tên quá ngắn").max(100).optional(),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
});
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const listUsersQuerySchema = z.object({
  role: roleEnum.optional(),
  status: statusEnum.optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
