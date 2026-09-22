import type { Notification } from "@prisma/client";
import type { NotificationDto } from "@petcare/types";

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    isRead: notification.isRead,
    refId: notification.refId,
    createdAt: notification.createdAt.toISOString(),
  };
}
