import { apiClient, unwrap } from "../../../shared/api/client";
import type {
  CreateCommentRequest,
  CreatePostRequest,
  PostCommentDto,
  PostDetailDto,
  PostDto,
  ToggleLikeResponse,
  UploadResponse,
} from "@petcare/types";

export const socialApi = {
  async create(input: CreatePostRequest): Promise<PostDto> {
    return unwrap(await apiClient.post("/posts", input));
  },

  async listFeed(): Promise<PostDto[]> {
    return unwrap(await apiClient.get("/posts"));
  },

  async getOne(id: string): Promise<PostDetailDto> {
    return unwrap(await apiClient.get(`/posts/${id}`));
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },

  async toggleLike(id: string): Promise<ToggleLikeResponse> {
    return unwrap(await apiClient.post(`/posts/${id}/like`));
  },

  async addComment(id: string, input: CreateCommentRequest): Promise<PostCommentDto> {
    return unwrap(await apiClient.post(`/posts/${id}/comments`, input));
  },

  async removeComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
  },

  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return unwrap(await apiClient.post("/uploads", formData));
  },
};
