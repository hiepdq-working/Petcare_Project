import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { PetService } from "./pet.service";
import { createPetSchema, updatePetSchema, type CreatePetInput, type UpdatePetInput } from "./pet.validator";

@Controller("pets")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PET_OWNER)
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  async create(@CurrentUser() auth: RequestAuth, @Body(new ZodValidationPipe(createPetSchema)) body: CreatePetInput) {
    const pet = await this.petService.create(auth.userId, body);
    return ok(pet, "Tạo hồ sơ thú cưng thành công");
  }

  @Get()
  async list(@CurrentUser() auth: RequestAuth) {
    const pets = await this.petService.listMine(auth.userId);
    return ok(pets);
  }

  @Get(":id")
  async getOne(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const pet = await this.petService.getOne(id, auth.userId);
    return ok(pet);
  }

  @Patch(":id")
  async update(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePetSchema)) body: UpdatePetInput,
  ) {
    const pet = await this.petService.update(id, auth.userId, body);
    return ok(pet, "Cập nhật hồ sơ thành công");
  }

  @Delete(":id")
  async remove(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    await this.petService.remove(id, auth.userId);
    return ok(null, "Đã xoá hồ sơ thú cưng");
  }
}
