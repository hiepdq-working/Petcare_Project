export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  content: string | null;
  isRead: boolean;
  refId: string | null;
  createdAt: string;
}
