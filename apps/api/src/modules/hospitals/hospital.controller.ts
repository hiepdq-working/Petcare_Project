import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { HospitalService } from "./hospital.service";
import { updateHospitalSchema, type UpdateHospitalInput } from "./hospital.validator";

@Controller("hospitals")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOSPITAL_OWNER)
export class HospitalController {
  constructor(private readonly service: HospitalService) {}

  @Get("me")
  async getMine(@CurrentUser() auth: RequestAuth) {
    const hospital = await this.service.getMine(auth.userId);
    return ok(hospital);
  }

  @Patch("me")
  async updateMine(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(updateHospitalSchema)) body: UpdateHospitalInput,
  ) {
    const hospital = await this.service.updateMine(auth.userId, body);
    return ok(hospital, "Cập nhật thông tin phòng khám thành công");
  }
}
