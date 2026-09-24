import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { UserService } from "./user.service";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
  type AdminCreateUserInput,
  type AdminUpdateUserInput,
  type ListUsersQuery,
} from "./user.validator";

// Entire module is Admin-only — see plan/context: this manages every
// account on the platform, never self-service.
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQuery) {
    const users = await this.service.list(query);
    return ok(users);
  }

  @Post()
  async create(@Body(new ZodValidationPipe(adminCreateUserSchema)) body: AdminCreateUserInput) {
    const user = await this.service.create(body);
    return ok(user, "Đã tạo tài khoản và gửi lời mời qua email");
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminUpdateUserSchema)) body: AdminUpdateUserInput,
  ) {
    const user = await this.service.update(id, body);
    return ok(user, "Đã cập nhật tài khoản");
  }

  @Delete(":id")
  async deactivate(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const user = await this.service.deactivate(id, auth.userId);
    return ok(user, "Đã vô hiệu hoá tài khoản");
  }
}
