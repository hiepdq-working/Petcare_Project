import type { ReviewDto } from "@petcare/types";
import type { ReviewWithUser } from "./review.repository";

export function toReviewDto(review: ReviewWithUser): ReviewDto {
  return {
    id: review.id,
    userId: review.userId,
    userName: review.user.name,
    userAvatar: review.user.avatar,
    hospitalId: review.providerId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}
