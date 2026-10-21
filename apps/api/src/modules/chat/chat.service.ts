import { Injectable } from "@nestjs/common";
import { UserRole, type ConversationDto, type MessageDto } from "@petcare/types";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { NotificationService } from "../notifications/notification.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { ChatRepository } from "./chat.repository";
import { toConversationDto, toMessageDto } from "./chat.types";
import type { SendMessageInput } from "./chat.validator";

@Injectable()
export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly notificationService: NotificationService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // Which inbox the caller reads and writes. Staff share the clinic owner's
  // inbox (conversations are keyed by the owner's user id) so a receptionist
  // can answer customers; everyone else uses their own. Only receptionists
  // get messaging — nurses have no inbox.
  private async resolveInboxId(userId: string, role: UserRole): Promise<string> {
    if (role !== UserRole.HOSPITAL_STAFF) return userId;
    const staff = await this.hospitalRepository.findStaffByUserId(userId);
    const hospital = await this.hospitalRepository.findByStaffUserId(userId);
    if (!staff || staff.position !== "RECEPTIONIST" || !hospital?.ownerId) {
      throw new ForbiddenError("Vị trí của bạn không có quyền truy cập tin nhắn phòng khám");
    }
    return hospital.ownerId;
  }

  // Everyone who should see live updates for an inbox: just the user, or
  // for a clinic owner also the active receptionists sharing that inbox.
  private async inboxMemberIds(inboxId: string): Promise<string[]> {
    const hospital = await this.hospitalRepository.findByOwnerId(inboxId);
    if (!hospital) return [inboxId];
    const receptionists = await this.hospitalRepository.findActiveStaffUserIds(hospital.id, "RECEPTIONIST");
    return [inboxId, ...receptionists];
  }

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

  async listMine(userId: string, role: UserRole): Promise<ConversationDto[]> {
    const inboxId = await this.resolveInboxId(userId, role);
    const conversations = await this.repository.findManyConversations(inboxId);
    return Promise.all(
      conversations.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          this.repository.findLastMessage(conversation.id),
          this.repository.countUnread(conversation.id, inboxId),
        ]);
        return toConversationDto(conversation, inboxId, lastMessage, unreadCount);
      }),
    );
  }

  async getMessages(conversationId: string, userId: string, role: UserRole): Promise<MessageDto[]> {
    const inboxId = await this.resolveInboxId(userId, role);
    await this.assertParticipant(conversationId, inboxId);
    await this.repository.markConversationRead(conversationId, inboxId);
    const messages = await this.repository.findMessages(conversationId);
    return messages.map(toMessageDto);
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    role: UserRole,
    input: SendMessageInput,
  ): Promise<MessageDto> {
    // Staff reply on behalf of the clinic, so the message is stored under
    // the owner's id — customers see one consistent "clinic" voice.
    const inboxId = await this.resolveInboxId(userId, role);
    const conversation = await this.assertParticipant(conversationId, inboxId);
    const messageType = input.mediaUrl ? "image" : "text";

    const message = await this.repository.createMessage({
      conversationId,
      senderId: inboxId,
      message: input.message ?? "",
      messageType,
      mediaUrl: input.mediaUrl,
    });

    const recipientId = conversation.user1Id === inboxId ? conversation.user2Id : conversation.user1Id;
    // Only gate the notification when the recipient is a Hospital Owner
    // with the preference turned off — a Pet Owner recipient is never
    // gated (see HospitalProfilePage's "Thông báo" toggles).
    const recipientHospital = await this.hospitalRepository.findByOwnerId(recipientId);
    const recipientMembers = await this.inboxMemberIds(recipientId);
    if (!recipientHospital || recipientHospital.notifyNewMessage) {
      for (const memberId of recipientMembers) {
        await this.notificationService.create({
          userId: memberId,
          type: "MESSAGE",
          title: `${message.sender.name} đã gửi tin nhắn`,
          content: messageType === "image" ? "Đã gửi một ảnh" : input.message,
          refId: conversation.id,
        });
      }
    }

    const dto = toMessageDto(message);
    // Pushed to the recipient side (new message to react to) and back to
    // the sender side (so their other open tabs/devices — or colleagues
    // sharing the clinic inbox — stay in sync too).
    for (const memberId of recipientMembers) {
      this.realtime.emitToUser(memberId, "message:new", dto);
      this.realtime.emitToUser(memberId, "conversation:updated", { conversationId: conversation.id });
    }
    for (const memberId of await this.inboxMemberIds(inboxId)) {
      this.realtime.emitToUser(memberId, "conversation:updated", { conversationId: conversation.id });
    }

    return dto;
  }
}
