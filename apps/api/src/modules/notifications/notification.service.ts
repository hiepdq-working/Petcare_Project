import { Injectable } from "@nestjs/common";
import type { NotificationType } from "@prisma/client";
import type { NotificationDto } from "@petcare/types";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { PrismaService } from "../../prisma/prisma.service";
import { toNotificationDto } from "./notification.types";

interface CreateInput {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  refId?: string;
}

// "Notification is infrastructure, not a feature" (see ARCHITECTURE.md /
// the ChatGPT analysis "Hạn chế số 6") — Appointment (and later Chat,
// Social, Reminder...) just calls create(); it never touches the
// notifications table directly. @Global so no module needs to import this
// one explicitly to publish.
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        refId: input.refId,
      },
    });
  }

  async listMine(userId: string): Promise<NotificationDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return notifications.map(toNotificationDto);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundError("Không tìm thấy thông báo");
    }
    if (notification.userId !== userId) {
      throw new ForbiddenError("Bạn không có quyền truy cập thông báo này");
    }
    await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }
}
