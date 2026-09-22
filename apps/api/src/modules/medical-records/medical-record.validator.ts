import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

const contentShape = {
  diagnosis: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  treatment: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  symptoms: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  cause: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  conclusion: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
};

// A version with every field empty carries no clinical information — reject
// it rather than storing a blank row a Vet almost certainly didn't intend.
function hasAnyContent(data: Record<string, string | undefined>): boolean {
  return Object.values(data).some((value) => value !== undefined && value.length > 0);
}

export const createMedicalRecordSchema = z
  .object({
    petId: z.string().uuid("Thú cưng không hợp lệ"),
    recordDate: z.preprocess(emptyToUndefined, z.string().optional()),
    ...contentShape,
  })
  .refine(hasAnyContent, { message: "Vui lòng nhập ít nhất một nội dung khám" });
export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;

export const addMedicalRecordVersionSchema = z
  .object(contentShape)
  .refine(hasAnyContent, { message: "Vui lòng nhập ít nhất một nội dung khám" });
export type AddMedicalRecordVersionInput = z.infer<typeof addMedicalRecordVersionSchema>;

export const addMedicalFileSchema = z.object({
  fileName: z.string().trim().min(1, "Tên file không hợp lệ").max(255),
  fileUrl: z.string().trim().url("Đường dẫn file không hợp lệ"),
  fileType: z.string().trim().min(1).max(50),
});
export type AddMedicalFileInput = z.infer<typeof addMedicalFileSchema>;
