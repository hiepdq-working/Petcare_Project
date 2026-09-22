import { apiClient, unwrap } from "../../../shared/api/client";
import type { ConversationDto, MessageDto, SendMessageRequest, UploadResponse } from "@petcare/types";

export const chatApi = {
  async startWithHospital(hospitalId: string): Promise<ConversationDto> {
    return unwrap(await apiClient.post(`/conversations/hospital/${hospitalId}`));
  },

  async listConversations(): Promise<ConversationDto[]> {
    return unwrap(await apiClient.get("/conversations"));
  },

  async getMessages(conversationId: string): Promise<MessageDto[]> {
    return unwrap(await apiClient.get(`/conversations/${conversationId}/messages`));
  },

  async sendMessage(conversationId: string, input: SendMessageRequest): Promise<MessageDto> {
    return unwrap(await apiClient.post(`/conversations/${conversationId}/messages`, input));
  },

  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return unwrap(await apiClient.post("/uploads", formData));
  },
};
