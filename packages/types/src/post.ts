import type { UserRole } from "./enums";

export const PostKind = {
  NORMAL: "NORMAL",
  PROMOTION: "PROMOTION",
} as const;
export type PostKind = (typeof PostKind)[keyof typeof PostKind];

export interface PostMediaDto {
  id: string;
  mediaUrl: string;
  mediaType: string;
}

export interface PostCommentDto {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  // Lets the UI badge a Hospital's own reply as an official response,
  // distinct from an ordinary Pet Owner commenting.
  userRole: UserRole;
  parentId: string | null;
  content: string;
  createdAt: string;
}

export interface PostDto {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  petId: string | null;
  petName: string | null;
  petAvatar: string | null;
  // Set only for a Hospital's own post (never for a Pet Owner's) — presence
  // of hospitalId is what the frontend uses to tell the two apart.
  hospitalId: string | null;
  hospitalName: string | null;
  hospitalLat: number | null;
  hospitalLng: number | null;
  vetId: string | null;
  vetName: string | null;
  content: string | null;
  media: PostMediaDto[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  kind: PostKind;
  // Only set when kind === PROMOTION.
  promoTitle: string | null;
  discountText: string | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  createdAt: string;
}

export interface PostDetailDto {
  post: PostDto;
  comments: PostCommentDto[];
}

export interface CreatePostRequest {
  content?: string;
  petId?: string;
  vetId?: string;
  media?: { mediaUrl: string; mediaType: string }[];
  // Hospital Owner only.
  kind?: PostKind;
  promoTitle?: string;
  discountText?: string;
  promoStartsAt?: string;
  promoEndsAt?: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface ToggleLikeResponse {
  liked: boolean;
}

export interface ToggleSaveResponse {
  saved: boolean;
}
