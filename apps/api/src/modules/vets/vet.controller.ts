import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { VetService } from "./vet.service";
import { createVetSchema, updateVetSchema, type CreateVetInput, type UpdateVetInput } from "./vet.validator";

@Controller("vets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class VetController {
  constructor(private readonly service: VetService) {}

  @Post()
  @Roles(UserRole.HOSPITAL_OWNER)
  async create(@CurrentUser() auth: RequestAuth, @Body(new ZodValidationPipe(createVetSchema)) body: CreateVetInput) {
    const vet = await this.service.create(auth.userId, body);
    return ok(vet, "Đã tạo tài khoản bác sĩ, email mời đặt mật khẩu đã được gửi");
  }

  @Get()
  @Roles(UserRole.HOSPITAL_OWNER)
  async list(@CurrentUser() auth: RequestAuth) {
    const vets = await this.service.listMine(auth.userId);
    return ok(vets);
  }

  // Static "me" route must be declared before the dynamic ":id" route
  // below, or Nest would try to match "me" as an :id param instead.
  @Get("me")
  @Roles(UserRole.VET)
  async me(@CurrentUser() auth: RequestAuth) {
    const vet = await this.service.getMyProfile(auth.userId);
    return ok(vet);
  }

  @Get(":id")
  @Roles(UserRole.HOSPITAL_OWNER)
  async getOne(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const vet = await this.service.getOneMine(auth.userId, id);
    return ok(vet);
  }

  @Patch(":id")
  @Roles(UserRole.HOSPITAL_OWNER)
  async update(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateVetSchema)) body: UpdateVetInput,
  ) {
    const vet = await this.service.update(auth.userId, id, body);
    return ok(vet, "Cập nhật thông tin bác sĩ thành công");
  }
}
