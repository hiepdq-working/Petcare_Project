import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

// Accepts both a full ISO datetime and the bare "YYYY-MM-DDTHH:mm" string
// an <input type="datetime-local"> produces (which fails z.string().datetime()'s
// stricter RFC 3339 check) — anything the JS Date constructor can parse.
const futureDateTime = z
  .string()
  .min(1, "Vui lòng chọn thời gian")
  .transform((value, ctx) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thời gian không hợp lệ" });
      return z.NEVER;
    }
    return date;
  })
  .refine((date) => date.getTime() > Date.now(), { message: "Thời gian đặt lịch phải ở tương lai" });

export const createAppointmentSchema = z.object({
  petId: z.string().uuid("Thú cưng không hợp lệ"),
  hospitalId: z.string().uuid("Phòng khám không hợp lệ"),
  serviceId: z.string().uuid("Dịch vụ không hợp lệ"),
  vetId: z.preprocess(emptyToUndefined, z.string().uuid("Bác sĩ không hợp lệ").optional()),
  dateTime: futureDateTime,
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
});
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
