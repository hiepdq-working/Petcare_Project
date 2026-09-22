export interface ReviewDto {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  hospitalId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface HospitalReviewSummaryDto {
  hospitalId: string;
  averageRating: number;
  totalCount: number;
  reviews: ReviewDto[];
}

export interface CreateReviewRequest {
  hospitalId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}
