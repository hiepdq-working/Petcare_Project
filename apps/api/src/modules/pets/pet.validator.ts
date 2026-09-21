import { z } from "zod";

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

export const createPetSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên thú cưng").max(100),
  species: z.string().trim().min(1, "Vui lòng nhập loài").max(50),
  breed: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  birthDate: z.preprocess(emptyToUndefined, z.string().date("Ngày sinh không hợp lệ").optional()),
  weight: z.preprocess(emptyToUndefined, z.coerce.number().positive("Cân nặng phải lớn hơn 0").max(500).optional()),
  avatar: z.preprocess(emptyToUndefined, z.string().url("URL ảnh không hợp lệ").max(500).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
});
export type CreatePetInput = z.infer<typeof createPetSchema>;

export const updatePetSchema = createPetSchema.partial();
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
