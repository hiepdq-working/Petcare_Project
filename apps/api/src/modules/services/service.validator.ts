import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập tên dịch vụ").max(200),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  price: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(1_000_000_000).optional()),
  duration: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().max(480).optional()),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial();
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
