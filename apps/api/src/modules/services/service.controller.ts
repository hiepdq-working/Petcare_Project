import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { ServiceService } from "./service.service";
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
} from "./service.validator";

@Controller("services")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOSPITAL_OWNER)
export class ServiceController {
  constructor(private readonly service: ServiceService) {}

  @Post()
  async create(@CurrentUser() auth: RequestAuth, @Body(new ZodValidationPipe(createServiceSchema)) body: CreateServiceInput) {
    const service = await this.service.create(auth.userId, body);
    return ok(service, "Đã thêm dịch vụ");
  }

  @Get()
  async list(@CurrentUser() auth: RequestAuth) {
    const services = await this.service.listMine(auth.userId);
    return ok(services);
  }

  @Patch(":id")
  async update(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateServiceSchema)) body: UpdateServiceInput,
  ) {
    const service = await this.service.update(auth.userId, id, body);
    return ok(service, "Cập nhật dịch vụ thành công");
  }

  @Delete(":id")
  async remove(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    await this.service.remove(auth.userId, id);
    return ok(null, "Đã xoá dịch vụ");
  }
}
