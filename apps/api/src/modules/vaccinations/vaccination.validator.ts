import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const createVaccinationSchema = z.object({
  petId: z.string().uuid("Thú cưng không hợp lệ"),
  vaccineName: z.string().trim().min(1, "Vui lòng nhập tên vắc-xin").max(200),
  dateGiven: z
    .string()
    .min(1, "Vui lòng chọn ngày tiêm")
    .transform((value, ctx) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ngày tiêm không hợp lệ" });
        return z.NEVER;
      }
      return date;
    }),
  nextDueDate: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .transform((value, ctx) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ngày tái chủng không hợp lệ" });
          return z.NEVER;
        }
        return date;
      })
      .optional(),
  ),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
});
export type CreateVaccinationInput = z.infer<typeof createVaccinationSchema>;
