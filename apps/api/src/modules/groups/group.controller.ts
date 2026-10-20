import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { GroupService } from "./group.service";
import { createGroupSchema, type CreateGroupInput } from "./group.validator";

@Controller("groups")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PET_OWNER)
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Post()
  async create(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(createGroupSchema)) body: CreateGroupInput,
  ) {
    const group = await this.service.create(auth.userId, body);
    return ok(group, "Đã tạo nhóm");
  }

  @Get()
  async list(@CurrentUser() auth: RequestAuth, @Query("mine") mine?: string) {
    const groups = await this.service.list(auth.userId, mine === "true");
    return ok(groups);
  }

  @Get(":id")
  async getOne(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const group = await this.service.getOne(id, auth.userId);
    return ok(group);
  }

  @Post(":id/join")
  async join(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const group = await this.service.join(id, auth.userId);
    return ok(group, "Đã tham gia nhóm");
  }

  @Post(":id/leave")
  async leave(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const group = await this.service.leave(id, auth.userId);
    return ok(group, "Đã rời nhóm");
  }
}
