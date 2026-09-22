import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

const rating = z.number().int().min(1, "Đánh giá tối thiểu 1 sao").max(5, "Đánh giá tối đa 5 sao");
const comment = z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional());

export const createReviewSchema = z.object({
  hospitalId: z.string().uuid("Phòng khám không hợp lệ"),
  rating,
  comment,
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
  rating: rating.optional(),
  comment,
});
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
