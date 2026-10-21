export interface ConversationDto {
  id: string;
  // The identity the viewer acts as in this inbox: their own id, or the
  // clinic owner's id for staff sharing the clinic inbox.
  viewerId: string;
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
