import { Injectable } from "@nestjs/common";
import type { Conversation, Message, User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type ConversationWithUsers = Conversation & { user1: User; user2: User };
export type MessageWithSender = Message & { sender: User };

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  // The @@unique([user1Id, user2Id]) constraint isn't symmetric, so a
  // lookup has to check both orderings before creating a new row.
  async findOrCreateConversation(userAId: string, userBId: string): Promise<ConversationWithUsers> {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userAId, user2Id: userBId },
          { user1Id: userBId, user2Id: userAId },
        ],
      },
      include: { user1: true, user2: true },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { user1Id: userAId, user2Id: userBId },
      include: { user1: true, user2: true },
    });
  }

  findConversationById(id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  findManyConversations(userId: string): Promise<ConversationWithUsers[]> {
    return this.prisma.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: { user1: true, user2: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  findLastMessage(conversationId: string): Promise<Message | null> {
    return this.prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: "desc" } });
  }

  countUnread(conversationId: string, userId: string): Promise<number> {
    return this.prisma.message.count({
      where: { conversationId, senderId: { not: userId }, isRead: false },
    });
  }

  findMessages(conversationId: string, take = 100): Promise<MessageWithSender[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: true },
      orderBy: { createdAt: "asc" },
      take,
    });
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    message: string;
    messageType: string;
    mediaUrl?: string;
  }): Promise<MessageWithSender> {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({ data, include: { sender: true } });
      // Bumps Conversation.updatedAt (an empty update still touches
      // @updatedAt) so the inbox can order by recent activity.
      await tx.conversation.update({ where: { id: data.conversationId }, data: {} });
      return message;
    });
  }

  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });
  }
}
