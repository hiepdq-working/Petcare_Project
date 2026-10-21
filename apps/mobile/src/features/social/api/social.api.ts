import type {
  CreateCommentRequest,
  CreatePostRequest,
  PostCommentDto,
  PostDetailDto,
  PostDto,
  ToggleLikeResponse,
  ToggleSaveResponse,
} from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

export const socialApi = {
  async create(input: CreatePostRequest): Promise<PostDto> {
    return unwrap(await apiClient.post("/posts", input));
  },
  // `before` is the createdAt of the last post already loaded (newest first).
  async listFeed(params: { limit?: number; before?: string } = {}): Promise<PostDto[]> {
    return unwrap(await apiClient.get("/posts", { params }));
  },
  async listByPet(petId: string): Promise<PostDto[]> {
    return unwrap(await apiClient.get(`/posts/pet/${petId}`));
  },
  async listPromotions(): Promise<PostDto[]> {
    return unwrap(await apiClient.get("/posts/promotions"));
  },
  async listSaved(): Promise<PostDto[]> {
    return unwrap(await apiClient.get("/posts/saved"));
  },
  async listByGroup(groupId: string): Promise<PostDto[]> {
    return unwrap(await apiClient.get(`/posts/group/${groupId}`));
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
  async toggleSave(id: string): Promise<ToggleSaveResponse> {
    return unwrap(await apiClient.post(`/posts/${id}/save`));
  },
  async addComment(id: string, input: CreateCommentRequest): Promise<PostCommentDto> {
    return unwrap(await apiClient.post(`/posts/${id}/comments`, input));
  },
  async removeComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
  },
};
