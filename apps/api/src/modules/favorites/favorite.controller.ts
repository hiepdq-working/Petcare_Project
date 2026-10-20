import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { FavoriteService } from "./favorite.service";

@Controller("favorites")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PET_OWNER)
export class FavoriteController {
  constructor(private readonly service: FavoriteService) {}

  @Get("hospitals")
  async listHospitals(@CurrentUser() auth: RequestAuth) {
    const hospitals = await this.service.listHospitals(auth.userId);
    return ok(hospitals);
  }

  @Post("hospitals/:hospitalId")
  async toggleHospital(@CurrentUser() auth: RequestAuth, @Param("hospitalId") hospitalId: string) {
    const result = await this.service.toggleHospital(auth.userId, hospitalId);
    return ok(result);
  }
}
