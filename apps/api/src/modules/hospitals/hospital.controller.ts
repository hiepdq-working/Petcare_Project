import { Controller, Get, Body, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import { IpRateLimitGuard, RateLimit } from "../../common/security/ip-rate-limit.guard";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { HospitalService } from "./hospital.service";
import {
  searchHospitalsSchema,
  updateHospitalSchema,
  type SearchHospitalsInput,
  type UpdateHospitalInput,
} from "./hospital.validator";

@Controller("hospitals")
export class HospitalController {
  constructor(private readonly service: HospitalService) {}

  // Public — browsing/searching hospitals never requires an account, per
  // product decision (only *interacting*, e.g. booking, does later).
  // Rate-limited since there's no logged-in identity behind it.
  @Get("nearby")
  @UseGuards(IpRateLimitGuard)
  @RateLimit({ limit: 60, windowMs: 60_000 })
  async nearby(@Query(new ZodValidationPipe(searchHospitalsSchema)) query: SearchHospitalsInput) {
    const results = await this.service.searchNearby(query);
    return ok(results);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOSPITAL_OWNER)
  async getMine(@CurrentUser() auth: RequestAuth) {
    const hospital = await this.service.getMine(auth.userId);
    return ok(hospital);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOSPITAL_OWNER)
  async updateMine(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(updateHospitalSchema)) body: UpdateHospitalInput,
  ) {
    const hospital = await this.service.updateMine(auth.userId, body);
    return ok(hospital, "Cập nhật thông tin phòng khám thành công");
  }

  // Public — the ":id" wildcard must stay declared after "nearby"/"me"
  // above, or it would swallow those static routes instead.
  @Get(":id")
  async getPublicOne(@Param("id") id: string) {
    const hospital = await this.service.getPublicById(id);
    return ok(hospital);
  }
}
