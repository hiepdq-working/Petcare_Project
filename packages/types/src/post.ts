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
  content: string | null;
  media: PostMediaDto[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface PostDetailDto {
  post: PostDto;
  comments: PostCommentDto[];
}

export interface CreatePostRequest {
  content?: string;
  petId?: string;
  media?: { mediaUrl: string; mediaType: string }[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface ToggleLikeResponse {
  liked: boolean;
}
