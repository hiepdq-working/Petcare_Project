import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

// Only "image" for now — there's no video upload pipeline (see
// multer.config.ts), so accepting "video" here would let the client claim
// a media type the backend can never actually serve correctly.
const postMediaSchema = z.object({
  mediaUrl: z.string().trim().url("Đường dẫn ảnh không hợp lệ"),
  mediaType: z.literal("image"),
});

// Upper bound across both roles — PostService further restricts a Pet
// Owner's post to exactly 1 image (Hospital may use up to this max of 5).
const MAX_MEDIA_PER_POST = 5;

export const createPostSchema = z
  .object({
    content: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    petId: z.preprocess(emptyToUndefined, z.string().uuid("Thú cưng không hợp lệ").optional()),
    vetId: z.preprocess(emptyToUndefined, z.string().uuid("Bác sĩ không hợp lệ").optional()),
    media: z.array(postMediaSchema).max(MAX_MEDIA_PER_POST).optional(),
  })
  .refine((data) => (data.content && data.content.length > 0) || (data.media && data.media.length > 0), {
    message: "Vui lòng nhập nội dung hoặc thêm ảnh",
  });
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Vui lòng nhập nội dung bình luận").max(1000),
  parentId: z.preprocess(emptyToUndefined, z.string().uuid("Bình luận không hợp lệ").optional()),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
