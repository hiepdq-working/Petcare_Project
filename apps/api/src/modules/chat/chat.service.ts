import { Injectable } from "@nestjs/common";
import type { ConversationDto, MessageDto } from "@petcare/types";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { NotificationService } from "../notifications/notification.service";
import { ChatRepository } from "./chat.repository";
import { toConversationDto, toMessageDto } from "./chat.types";
import type { SendMessageInput } from "./chat.validator";

@Injectable()
export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly notificationService: NotificationService,
  ) {}

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.repository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError("Không tìm thấy cuộc trò chuyện");
    }
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenError("Bạn không có quyền truy cập cuộc trò chuyện này");
    }
    return conversation;
  }

  // The only way a conversation currently gets created — a Pet Owner
  // reaching out to a hospital they're browsing. Replying is open to
  // either side once the conversation exists (see sendMessage).
  async startWithHospital(userId: string, hospitalId: string): Promise<ConversationDto> {
    const hospital = await this.hospitalRepository.findById(hospitalId);
    if (!hospital || !hospital.ownerId) {
      throw new NotFoundError("Không tìm thấy phòng khám");
    }
    const conversation = await this.repository.findOrCreateConversation(userId, hospital.ownerId);
    const unreadCount = await this.repository.countUnread(conversation.id, userId);
    const lastMessage = await this.repository.findLastMessage(conversation.id);
    return toConversationDto(conversation, userId, lastMessage, unreadCount);
  }

  async listMine(userId: string): Promise<ConversationDto[]> {
    const conversations = await this.repository.findManyConversations(userId);
    return Promise.all(
      conversations.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          this.repository.findLastMessage(conversation.id),
          this.repository.countUnread(conversation.id, userId),
        ]);
        return toConversationDto(conversation, userId, lastMessage, unreadCount);
      }),
    );
  }

  async getMessages(conversationId: string, userId: string): Promise<MessageDto[]> {
    await this.assertParticipant(conversationId, userId);
    await this.repository.markConversationRead(conversationId, userId);
    const messages = await this.repository.findMessages(conversationId);
    return messages.map(toMessageDto);
  }

  async sendMessage(conversationId: string, userId: string, input: SendMessageInput): Promise<MessageDto> {
    const conversation = await this.assertParticipant(conversationId, userId);
    const messageType = input.mediaUrl ? "image" : "text";

    const message = await this.repository.createMessage({
      conversationId,
      senderId: userId,
      message: input.message ?? "",
      messageType,
      mediaUrl: input.mediaUrl,
    });

    const recipientId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
    await this.notificationService.create({
      userId: recipientId,
      type: "MESSAGE",
      title: `${message.sender.name} đã gửi tin nhắn`,
      content: messageType === "image" ? "Đã gửi một ảnh" : input.message,
      refId: conversation.id,
    });

    return toMessageDto(message);
  }
}
