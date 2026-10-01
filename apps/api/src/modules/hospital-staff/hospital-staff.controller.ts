import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { HospitalStaffService } from "./hospital-staff.service";
import {
  createHospitalStaffSchema,
  updateHospitalStaffSchema,
  type CreateHospitalStaffInput,
  type UpdateHospitalStaffInput,
} from "./hospital-staff.validator";

@Controller("hospital-staff")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOSPITAL_OWNER)
export class HospitalStaffController {
  constructor(private readonly service: HospitalStaffService) {}

  @Post()
  async create(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(createHospitalStaffSchema)) body: CreateHospitalStaffInput,
  ) {
    const staff = await this.service.create(auth.userId, body);
    return ok(staff, "Đã tạo tài khoản nhân viên, email mời đặt mật khẩu đã được gửi");
  }

  @Get()
  async list(@CurrentUser() auth: RequestAuth) {
    const staff = await this.service.listMine(auth.userId);
    return ok(staff);
  }

  @Patch(":id")
  async update(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateHospitalStaffSchema)) body: UpdateHospitalStaffInput,
  ) {
    const staff = await this.service.update(auth.userId, id, body);
    return ok(staff, "Cập nhật thông tin nhân viên thành công");
  }
}
