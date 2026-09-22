import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { ChatService } from "./chat.service";
import { sendMessageSchema, type SendMessageInput } from "./chat.validator";

@Controller("conversations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}

  // Only a Pet Owner initiates — the Hospital side just replies within
  // whatever conversation already exists (no @Roles below this point).
  @Post("hospital/:hospitalId")
  @Roles(UserRole.PET_OWNER)
  async startWithHospital(@CurrentUser() auth: RequestAuth, @Param("hospitalId") hospitalId: string) {
    const conversation = await this.service.startWithHospital(auth.userId, hospitalId);
    return ok(conversation);
  }

  @Get()
  async listMine(@CurrentUser() auth: RequestAuth) {
    const conversations = await this.service.listMine(auth.userId);
    return ok(conversations);
  }

  @Get(":id/messages")
  async getMessages(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const messages = await this.service.getMessages(id, auth.userId);
    return ok(messages);
  }

  @Post(":id/messages")
  async sendMessage(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageInput,
  ) {
    const message = await this.service.sendMessage(id, auth.userId, body);
    return ok(message);
  }
}
