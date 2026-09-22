import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ok } from "../../common/response/api-response";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { NotificationService } from "./notification.service";

// Every role can have notifications, so this only needs JwtAuthGuard —
// no @Roles restriction, unlike most other controllers.
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  async list(@CurrentUser() auth: RequestAuth) {
    const notifications = await this.service.listMine(auth.userId);
    return ok(notifications);
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() auth: RequestAuth) {
    const count = await this.service.unreadCount(auth.userId);
    return ok({ count });
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    await this.service.markRead(auth.userId, id);
    return ok(null, "Đã đánh dấu đã đọc");
  }
}
