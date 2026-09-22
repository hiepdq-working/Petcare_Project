export interface ConversationDto {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageType: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  message: string;
  messageType: string;
  mediaUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  message?: string;
  mediaUrl?: string;
}
