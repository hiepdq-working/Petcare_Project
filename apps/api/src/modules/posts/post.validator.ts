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
    groupId: z.preprocess(emptyToUndefined, z.string().uuid("Nhóm không hợp lệ").optional()),
    media: z.array(postMediaSchema).max(MAX_MEDIA_PER_POST).optional(),
    kind: z.enum(["NORMAL", "PROMOTION"]).default("NORMAL"),
    promoTitle: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    discountText: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
    promoStartsAt: z.preprocess(emptyToUndefined, z.coerce.date({ invalid_type_error: "Ngày bắt đầu không hợp lệ" }).optional()),
    promoEndsAt: z.preprocess(emptyToUndefined, z.coerce.date({ invalid_type_error: "Ngày kết thúc không hợp lệ" }).optional()),
  })
  .refine(
    (data) =>
      (data.content && data.content.length > 0) ||
      (data.media && data.media.length > 0) ||
      (data.kind === "PROMOTION" && !!data.promoTitle),
    { message: "Vui lòng nhập nội dung hoặc thêm ảnh" },
  )
  .superRefine((data, ctx) => {
    const hasPromoFields = data.promoTitle || data.discountText || data.promoStartsAt || data.promoEndsAt;
    if (data.kind === "NORMAL") {
      if (hasPromoFields) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thông tin khuyến mãi chỉ dùng cho bài khuyến mãi" });
      }
      return;
    }
    if (!data.promoTitle) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoTitle"], message: "Vui lòng nhập tiêu đề khuyến mãi" });
    }
    if (!data.promoEndsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoEndsAt"], message: "Vui lòng chọn ngày kết thúc khuyến mãi" });
      return;
    }
    if (data.promoEndsAt.getTime() <= Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoEndsAt"], message: "Ngày kết thúc phải ở tương lai" });
    }
    if (data.promoStartsAt && data.promoEndsAt.getTime() <= data.promoStartsAt.getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoEndsAt"], message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }
  });
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Vui lòng nhập nội dung bình luận").max(1000),
  parentId: z.preprocess(emptyToUndefined, z.string().uuid("Bình luận không hợp lệ").optional()),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
