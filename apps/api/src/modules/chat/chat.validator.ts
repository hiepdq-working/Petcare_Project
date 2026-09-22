import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

// Exactly one image per message — mediaUrl is a single field, not an
// array, so this is enforced by shape alone (see Message.mediaUrl).
export const sendMessageSchema = z
  .object({
    message: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    mediaUrl: z.preprocess(emptyToUndefined, z.string().trim().url("Đường dẫn ảnh không hợp lệ").optional()),
  })
  .refine((data) => (data.message && data.message.length > 0) || data.mediaUrl, {
    message: "Vui lòng nhập tin nhắn hoặc gửi ảnh",
  });
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
