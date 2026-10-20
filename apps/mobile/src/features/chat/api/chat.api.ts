import type { ConversationDto, MessageDto, SendMessageRequest } from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

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
};
