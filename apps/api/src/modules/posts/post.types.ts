import type { PostCommentDto, PostDto } from "@petcare/types";
import type { CommentWithUser, PostWithRelations } from "./post.repository";

export function toPostDto(post: PostWithRelations): PostDto {
  return {
    id: post.id,
    userId: post.userId,
    userName: post.user.name,
    userAvatar: post.user.avatar,
    petId: post.petId,
    petName: post.pet?.name ?? null,
    petAvatar: post.pet?.avatar ?? null,
    hospitalId: post.hospitalId,
    hospitalName: post.hospital?.name ?? null,
    hospitalLat: post.hospital?.lat ?? null,
    hospitalLng: post.hospital?.lng ?? null,
    vetId: post.vetId,
    vetName: post.vet?.user.name ?? null,
    content: post.content,
    media: post.media.map((m) => ({ id: m.id, mediaUrl: m.mediaUrl, mediaType: m.mediaType })),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: post.likes.length > 0,
    createdAt: post.createdAt.toISOString(),
  };
}

export function toCommentDto(comment: CommentWithUser): PostCommentDto {
  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    userName: comment.user.name,
    userAvatar: comment.user.avatar,
    userRole: comment.user.role,
    parentId: comment.parentId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
}
