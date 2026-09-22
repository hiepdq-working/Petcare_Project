import type { ConversationDto, MessageDto } from "@petcare/types";
import type { Message } from "@prisma/client";
import type { ConversationWithUsers, MessageWithSender } from "./chat.repository";

export function toConversationDto(
  conversation: ConversationWithUsers,
  requesterId: string,
  lastMessage: Message | null,
  unreadCount: number,
): ConversationDto {
  const otherUser = conversation.user1Id === requesterId ? conversation.user2 : conversation.user1;
  return {
    id: conversation.id,
    otherUserId: otherUser.id,
    otherUserName: otherUser.name,
    otherUserAvatar: otherUser.avatar,
    lastMessage: lastMessage?.message ?? null,
    lastMessageType: lastMessage?.messageType ?? null,
    lastMessageAt: lastMessage ? lastMessage.createdAt.toISOString() : null,
    unreadCount,
  };
}

export function toMessageDto(message: MessageWithSender): MessageDto {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderAvatar: message.sender.avatar,
    message: message.message,
    messageType: message.messageType,
    mediaUrl: message.mediaUrl,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  };
}
