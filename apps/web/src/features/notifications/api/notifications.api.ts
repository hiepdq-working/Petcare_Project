import { apiClient, unwrap } from "../../../shared/api/client";
import type { NotificationDto } from "@petcare/types";

export const notificationsApi = {
  async list(): Promise<NotificationDto[]> {
    return unwrap(await apiClient.get("/notifications"));
  },

  async unreadCount(): Promise<number> {
    const result = await unwrap<{ count: number }>(await apiClient.get("/notifications/unread-count"));
    return result.count;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },
};
