import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, "Tên nhóm quá ngắn").max(100),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
  cover: z.preprocess(emptyToUndefined, z.string().url("URL không hợp lệ").max(500).optional()),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
