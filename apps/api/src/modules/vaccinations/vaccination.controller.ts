import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { VaccinationService } from "./vaccination.service";
import { createVaccinationSchema, type CreateVaccinationInput } from "./vaccination.validator";

@Controller("vaccinations")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PET_OWNER, UserRole.VET)
export class VaccinationController {
  constructor(private readonly service: VaccinationService) {}

  @Post()
  async create(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(createVaccinationSchema)) body: CreateVaccinationInput,
  ) {
    const vaccination = await this.service.create(auth.userId, auth.role, body);
    return ok(vaccination, "Đã ghi nhận mũi tiêm phòng");
  }

  @Get("pet/:petId")
  async listByPet(@CurrentUser() auth: RequestAuth, @Param("petId") petId: string) {
    const vaccinations = await this.service.listByPet(petId, auth.userId, auth.role);
    return ok(vaccinations);
  }
}
